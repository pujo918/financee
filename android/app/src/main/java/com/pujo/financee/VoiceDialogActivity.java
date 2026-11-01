package com.pujo.financee;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.os.Vibrator;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.view.View;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class VoiceDialogActivity extends Activity {

    private SpeechRecognizer speechRecognizer;
    private TextView transcriptText;
    private TextView nominalText;
    private TextView categoryText;
    private TextView typeText;
    private TextView statusText;
    private ImageView micGlow;
    private ImageView avatarView;

    private String currentTranscript = "";
    private long currentAmount = 0;
    private String currentCategory = "food";
    private String currentCategoryLabel = "Makanan & Minuman";
    private String currentType = "expense";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_voice_dialog);

        transcriptText = findViewById(R.id.dialogTranscriptText);
        nominalText = findViewById(R.id.dialogNominalText);
        categoryText = findViewById(R.id.dialogCategoryText);
        typeText = findViewById(R.id.dialogTypeText);
        statusText = findViewById(R.id.dialogStatusText);
        micGlow = findViewById(R.id.dialogMicGlow);
        avatarView = findViewById(R.id.dialogAvatar);

        SharedPreferences prefs = getSharedPreferences("FinanceWidgetPrefs", Context.MODE_PRIVATE);
        String theme = prefs.getString("theme", "onepiece");
        if ("naruto".equalsIgnoreCase(theme)) {
            avatarView.setImageResource(R.drawable.avatar_naruto);
            micGlow.setBackgroundResource(R.drawable.widget_glow_mic_orange);
        } else {
            avatarView.setImageResource(R.drawable.avatar_luffy);
            micGlow.setBackgroundResource(R.drawable.widget_glow_mic_cyan);
        }

        findViewById(R.id.dialogOutsideOverlay).setOnClickListener(v -> finish());
        findViewById(R.id.dialogCard).setOnClickListener(v -> { /* keep dialog open on card click */ });
        findViewById(R.id.dialogCloseButton).setOnClickListener(v -> finish());

        findViewById(R.id.dialogMicButton).setOnClickListener(v -> startListening());

        findViewById(R.id.dialogSaveButton).setOnClickListener(v -> saveTransactionAndClose());

        findViewById(R.id.dialogEditButton).setOnClickListener(v -> {
            Intent intent = new Intent(this, MainActivity.class);
            intent.setAction("ACTION_VOICE_INPUT");
            intent.setData(Uri.parse("financee://voice"));
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            startActivity(intent);
            finish();
        });

        startListening();
    }

    private void startListening() {
        if (!SpeechRecognizer.isRecognitionAvailable(this)) {
            Toast.makeText(this, "Speech recognition tidak tersedia di perangkat ini.", Toast.LENGTH_SHORT).show();
            statusText.setText("Fitur suara tidak tersedia.");
            return;
        }

        if (speechRecognizer != null) {
            speechRecognizer.destroy();
        }

        speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this);
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "id-ID");
        intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);

        speechRecognizer.setRecognitionListener(new RecognitionListener() {
            @Override
            public void onReadyForSpeech(Bundle params) {
                statusText.setText("Mendengarkan... Silakan bicara");
            }

            @Override
            public void onBeginningOfSpeech() {
                statusText.setText("Merekam suara...");
            }

            @Override
            public void onRmsChanged(float rmsdB) {}

            @Override
            public void onBufferReceived(byte[] buffer) {}

            @Override
            public void onEndOfSpeech() {
                statusText.setText("Memproses ucapan...");
            }

            @Override
            public void onError(int error) {
                statusText.setText("Ketuk mic untuk coba lagi");
            }

            @Override
            public void onResults(Bundle results) {
                ArrayList<String> matches = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                if (matches != null && !matches.isEmpty()) {
                    processSpeechResult(matches.get(0));
                }
                statusText.setText("Selesai. Tekan Simpan");
            }

            @Override
            public void onPartialResults(Bundle partialResults) {
                ArrayList<String> matches = partialResults.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                if (matches != null && !matches.isEmpty()) {
                    processSpeechResult(matches.get(0));
                }
            }

            @Override
            public void onEvent(int eventType, Bundle params) {}
        });

        speechRecognizer.startListening(intent);
    }

    private void processSpeechResult(String text) {
        if (text == null || text.trim().isEmpty()) return;
        currentTranscript = text.trim();
        transcriptText.setText("\"" + currentTranscript + "\"");

        parseTransaction(currentTranscript);

        DecimalFormat formatter = new DecimalFormat("#,###", new DecimalFormatSymbols(Locale.GERMANY));
        String formattedNominal = "Rp " + formatter.format(currentAmount);
        nominalText.setText(formattedNominal);

        categoryText.setText(currentCategoryLabel);

        if ("income".equals(currentType)) {
            typeText.setText("Pemasukan");
            typeText.setTextColor(0xFF4ADE80);
            nominalText.setTextColor(0xFF4ADE80);
        } else {
            typeText.setText("Pengeluaran");
            typeText.setTextColor(0xFFF87171);
            nominalText.setTextColor(0xFF34D399);
        }
    }

    private void parseTransaction(String input) {
        String lower = input.toLowerCase();

        // 1. Determine Type
        if (lower.contains("gaji") || lower.contains("dapat") || lower.contains("terima") || lower.contains("bonus") || lower.contains("pemasukan")) {
            currentType = "income";
            currentCategory = "salary";
            currentCategoryLabel = "Gaji / Pemasukan";
        } else {
            currentType = "expense";
            // Determine Category
            if (lower.contains("bensin") || lower.contains("pertalite") || lower.contains("pertamax") || lower.contains("gojek") || lower.contains("grab") || lower.contains("ojol") || lower.contains("parkir") || lower.contains("tol")) {
                currentCategory = "transport";
                currentCategoryLabel = "Transportasi";
            } else if (lower.contains("pulsa") || lower.contains("listrik") || lower.contains("token") || lower.contains("wifi") || lower.contains("pdam") || lower.contains("air")) {
                currentCategory = "bills";
                currentCategoryLabel = "Tagihan";
            } else if (lower.contains("baju") || lower.contains("sepatu") || lower.contains("celana") || lower.contains("shopee") || lower.contains("tokopedia") || lower.contains("beli")) {
                currentCategory = "shopping";
                currentCategoryLabel = "Belanja";
            } else if (lower.contains("bioskop") || lower.contains("nonton") || lower.contains("game") || lower.contains("top up") || lower.contains("karaoke")) {
                currentCategory = "entertainment";
                currentCategoryLabel = "Hiburan";
            } else {
                currentCategory = "food";
                currentCategoryLabel = "Makanan & Minuman";
            }
        }

        // 2. Extract Amount
        currentAmount = extractAmount(lower);
    }

    private long extractAmount(String text) {
        // Pattern 1: e.g. "50k", "50 k", "25.000", "25000", "50rb", "50 ribu", "2 juta"
        Pattern pJuta = Pattern.compile("(\\d+(?:[.,]\\d+)?)\\s*(?:juta|jt)");
        Matcher mJuta = pJuta.matcher(text);
        if (mJuta.find()) {
            double val = Double.parseDouble(mJuta.group(1).replace(",", "."));
            return (long) (val * 1000000);
        }

        Pattern pRibu = Pattern.compile("(\\d+(?:[.,]\\d+)?)\\s*(?:ribu|rb|k\\b)");
        Matcher mRibu = pRibu.matcher(text);
        if (mRibu.find()) {
            double val = Double.parseDouble(mRibu.group(1).replace(",", "."));
            return (long) (val * 1000);
        }

        Pattern pPlain = Pattern.compile("\\b(\\d{4,9})\\b");
        Matcher mPlain = pPlain.matcher(text.replace(".", "").replace(",", ""));
        if (mPlain.find()) {
            try {
                return Long.parseLong(mPlain.group(1));
            } catch (Exception ignored) {}
        }

        // Pattern for slang words
        if (text.contains("seratus ribu")) return 100000;
        if (text.contains("lima puluh ribu") || text.contains("gocap")) return 50000;
        if (text.contains("dua puluh lima ribu") || text.contains("cepek")) return 25000;
        if (text.contains("dua puluh ribu")) return 20000;
        if (text.contains("sepuluh ribu") || text.contains("ceban")) return 10000;
        if (text.contains("lima ribu")) return 5000;

        return currentAmount > 0 ? currentAmount : 25000; // default reasonable placeholder
    }

    private void saveTransactionAndClose() {
        if (currentAmount <= 0) {
            Toast.makeText(this, "Nominal belum terdeteksi. Silakan coba bicara lagi.", Toast.LENGTH_SHORT).show();
            return;
        }

        try {
            SharedPreferences prefs = getSharedPreferences("FinanceWidgetPrefs", Context.MODE_PRIVATE);

            // 1. Build Transaction JSON
            JSONObject tx = new JSONObject();
            long now = System.currentTimeMillis();
            tx.put("id", now);
            tx.put("type", currentType);
            tx.put("amount", currentAmount);
            tx.put("category", currentCategory);
            tx.put("date", new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(new Date(now)));
            tx.put("description", currentTranscript.isEmpty() ? currentCategoryLabel : currentTranscript);
            tx.put("method", "voice");

            // 2. Append to pending queue in SharedPreferences
            String pendingJson = prefs.getString("pendingTransactions", "[]");
            JSONArray pending = new JSONArray(pendingJson);
            pending.put(tx);

            // 3. Update Widget Display Data
            DecimalFormat formatter = new DecimalFormat("#,###", new DecimalFormatSymbols(Locale.GERMANY));
            String nominalFormatted = "Rp " + formatter.format(currentAmount);

            prefs.edit()
                .putString("pendingTransactions", pending.toString())
                .putString("lastTranscript", currentTranscript.isEmpty() ? currentCategoryLabel : currentTranscript)
                .putString("lastNominal", nominalFormatted)
                .putString("lastCategory", currentCategoryLabel)
                .putString("lastType", "income".equals(currentType) ? "Pemasukan" : "Pengeluaran")
                .putLong("lastUpdated", now)
                .apply();

            // 4. Trigger Widget Update for both 4x2 and 4x1
            FinanceWidgetProvider.updateAllWidgets(this);
            FinanceVoiceWidgetProvider.updateAllWidgets(this);

            // Haptic vibration feedback
            try {
                Vibrator v = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
                if (v != null) v.vibrate(60);
            } catch (Exception ignored) {}

            Toast.makeText(this, "Tersimpan: " + nominalFormatted + " (" + currentCategoryLabel + ")", Toast.LENGTH_SHORT).show();

        } catch (Exception e) {
            Toast.makeText(this, "Gagal menyimpan: " + e.getMessage(), Toast.LENGTH_SHORT).show();
        }

        finish();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (speechRecognizer != null) {
            speechRecognizer.destroy();
        }
    }
}