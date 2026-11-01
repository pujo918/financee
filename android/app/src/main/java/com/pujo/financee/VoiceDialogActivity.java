package com.pujo.financee;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.os.Vibrator;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.view.View;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.LinearLayout;
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

    public static final String EXTRA_START_IN_EDIT_MODE = "EXTRA_START_IN_EDIT_MODE";

    private SpeechRecognizer speechRecognizer;
    private View dialogCard;
    private ImageView dialogAvatar;
    private TextView dialogTitleText;
    private TextView dialogStatusText;
    private TextView dialogCloseButton;

    // Mode 1: Voice
    private LinearLayout dialogVoiceSection;
    private ImageView dialogMicGlow;
    private TextView dialogTranscriptText;
    private TextView dialogNominalText;
    private TextView dialogCategoryText;
    private TextView dialogTypeText;
    private View dialogEditButton;
    private View dialogSaveButton;

    // Mode 2: Inline Edit
    private LinearLayout dialogEditSection;
    private EditText editAmountInput;
    private EditText editNoteInput;
    private TextView catFood;
    private TextView catTransport;
    private TextView catBills;
    private TextView catShopping;
    private TextView catEntertainment;
    private TextView catSalary;
    private TextView editBackToVoiceButton;
    private View editSaveButton;

    // State
    private String currentTheme = "onepiece";
    private String currentTranscript = "";
    private long currentAmount = 0;
    private String currentCategory = "food";
    private String currentCategoryLabel = "Makanan & Minuman";
    private String currentType = "expense";
    private boolean isEditMode = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_voice_dialog);

        bindViews();
        applyThemeStyling();
        setupListeners();

        // Check if launched directly in edit mode
        boolean startInEdit = getIntent() != null && getIntent().getBooleanExtra(EXTRA_START_IN_EDIT_MODE, false);
        if (startInEdit) {
            SharedPreferences prefs = getSharedPreferences("FinanceWidgetPrefs", Context.MODE_PRIVATE);
            String lastNominal = prefs.getString("lastNominal", "Rp 0").replace("Rp", "").replace(".", "").replace(",", "").trim();
            try {
                currentAmount = Long.parseLong(lastNominal);
            } catch (Exception ignored) {
                currentAmount = 25000;
            }
            currentTranscript = prefs.getString("lastTranscript", "Beli bakso & es teh").replace("\"", "");
            switchToEditMode();
        } else {
            switchToVoiceMode();
            startListening();
        }
    }

    private void bindViews() {
        dialogCard = findViewById(R.id.dialogCard);
        dialogAvatar = findViewById(R.id.dialogAvatar);
        dialogTitleText = findViewById(R.id.dialogTitleText);
        dialogStatusText = findViewById(R.id.dialogStatusText);
        dialogCloseButton = findViewById(R.id.dialogCloseButton);

        dialogVoiceSection = findViewById(R.id.dialogVoiceSection);
        dialogMicGlow = findViewById(R.id.dialogMicGlow);
        dialogTranscriptText = findViewById(R.id.dialogTranscriptText);
        dialogNominalText = findViewById(R.id.dialogNominalText);
        dialogCategoryText = findViewById(R.id.dialogCategoryText);
        dialogTypeText = findViewById(R.id.dialogTypeText);
        dialogEditButton = findViewById(R.id.dialogEditButton);
        dialogSaveButton = findViewById(R.id.dialogSaveButton);

        dialogEditSection = findViewById(R.id.dialogEditSection);
        editAmountInput = findViewById(R.id.editAmountInput);
        editNoteInput = findViewById(R.id.editNoteInput);
        catFood = findViewById(R.id.catFood);
        catTransport = findViewById(R.id.catTransport);
        catBills = findViewById(R.id.catBills);
        catShopping = findViewById(R.id.catShopping);
        catEntertainment = findViewById(R.id.catEntertainment);
        catSalary = findViewById(R.id.catSalary);
        editBackToVoiceButton = findViewById(R.id.editBackToVoiceButton);
        editSaveButton = findViewById(R.id.editSaveButton);
    }

    private void applyThemeStyling() {
        SharedPreferences prefs = getSharedPreferences("FinanceWidgetPrefs", Context.MODE_PRIVATE);
        currentTheme = prefs.getString("theme", "onepiece");

        if ("naruto".equalsIgnoreCase(currentTheme)) {
            dialogCard.setBackgroundResource(R.drawable.widget_bg_naruto);
            dialogAvatar.setImageResource(R.drawable.avatar_naruto);
            dialogAvatar.setScaleType(ImageView.ScaleType.CENTER_CROP);
            dialogAvatar.setBackgroundResource(R.drawable.widget_avatar_bg_naruto);
            dialogMicGlow.setBackgroundResource(R.drawable.widget_glow_mic_orange);
            dialogStatusText.setTextColor(0xFFF97316);
            dialogTitleText.setText("Catatan Suara (Naruto)");
        } else {
            dialogCard.setBackgroundResource(R.drawable.widget_bg_onepiece);
            dialogAvatar.setImageResource(R.drawable.avatar_luffy);
            dialogAvatar.setScaleType(ImageView.ScaleType.FIT_CENTER);
            dialogAvatar.setBackgroundResource(R.drawable.widget_avatar_bg_onepiece);
            dialogMicGlow.setBackgroundResource(R.drawable.widget_glow_mic_cyan);
            dialogStatusText.setTextColor(0xFF38BDF8);
            dialogTitleText.setText("Catatan Suara (One Piece)");
        }
    }

    private void setupListeners() {
        findViewById(R.id.dialogOutsideOverlay).setOnClickListener(v -> dismissCleanly());
        dialogCard.setOnClickListener(v -> { /* keep open */ });
        dialogCloseButton.setOnClickListener(v -> dismissCleanly());

        // Voice mode listeners
        findViewById(R.id.dialogMicButton).setOnClickListener(v -> startListening());
        dialogSaveButton.setOnClickListener(v -> saveTransactionAndClose());
        dialogEditButton.setOnClickListener(v -> switchToEditMode());

        // Inline edit quick increment listeners
        findViewById(R.id.chipAdd5k).setOnClickListener(v -> addNominalIncrement(5000));
        findViewById(R.id.chipAdd10k).setOnClickListener(v -> addNominalIncrement(10000));
        findViewById(R.id.chipAdd25k).setOnClickListener(v -> addNominalIncrement(25000));
        findViewById(R.id.chipAdd50k).setOnClickListener(v -> addNominalIncrement(50000));
        findViewById(R.id.chipResetAmount).setOnClickListener(v -> {
            currentAmount = 0;
            editAmountInput.setText("0");
        });

        // Inline edit category chips
        catFood.setOnClickListener(v -> selectCategory("food", "Makanan & Minuman", "expense"));
        catTransport.setOnClickListener(v -> selectCategory("transport", "Transportasi", "expense"));
        catBills.setOnClickListener(v -> selectCategory("bills", "Tagihan", "expense"));
        catShopping.setOnClickListener(v -> selectCategory("shopping", "Belanja", "expense"));
        catEntertainment.setOnClickListener(v -> selectCategory("entertainment", "Hiburan", "expense"));
        catSalary.setOnClickListener(v -> selectCategory("salary", "Pemasukan", "income"));

        // Inline edit action buttons
        editBackToVoiceButton.setOnClickListener(v -> switchToVoiceMode());
        editSaveButton.setOnClickListener(v -> saveFromEditAndClose());
    }

    private void switchToVoiceMode() {
        isEditMode = false;
        dialogVoiceSection.setVisibility(View.VISIBLE);
        dialogEditSection.setVisibility(View.GONE);
        dialogStatusText.setText("Mendengarkan... Silakan bicara");
    }

    private void switchToEditMode() {
        isEditMode = true;
        if (speechRecognizer != null) {
            speechRecognizer.stopListening();
        }
        dialogVoiceSection.setVisibility(View.GONE);
        dialogEditSection.setVisibility(View.VISIBLE);
        dialogStatusText.setText("Mode Edit Transaksi");

        editAmountInput.setText(String.valueOf(currentAmount > 0 ? currentAmount : 25000));
        editNoteInput.setText(currentTranscript.isEmpty() ? currentCategoryLabel : currentTranscript);
        updateCategoryChipsUI();
    }

    private void addNominalIncrement(long increment) {
        String raw = editAmountInput.getText().toString().trim();
        long current = 0;
        try {
            current = Long.parseLong(raw);
        } catch (Exception ignored) {}
        current += increment;
        editAmountInput.setText(String.valueOf(current));
    }

    private void selectCategory(String catKey, String catLabel, String type) {
        this.currentCategory = catKey;
        this.currentCategoryLabel = catLabel;
        this.currentType = type;
        updateCategoryChipsUI();
    }

    private void updateCategoryChipsUI() {
        resetChip(catFood);
        resetChip(catTransport);
        resetChip(catBills);
        resetChip(catShopping);
        resetChip(catEntertainment);
        resetChip(catSalary);

        if ("salary".equals(currentCategory)) {
            highlightChip(catSalary);
        } else if ("transport".equals(currentCategory)) {
            highlightChip(catTransport);
        } else if ("bills".equals(currentCategory)) {
            highlightChip(catBills);
        } else if ("shopping".equals(currentCategory)) {
            highlightChip(catShopping);
        } else if ("entertainment".equals(currentCategory)) {
            highlightChip(catEntertainment);
        } else {
            highlightChip(catFood);
        }
    }

    private void resetChip(TextView tv) {
        tv.setBackgroundResource(R.drawable.dialog_chip_unselected);
        tv.setTextColor(0xFFCBD5E1);
    }

    private void highlightChip(TextView tv) {
        tv.setBackgroundResource(R.drawable.dialog_chip_selected);
        tv.setTextColor(0xFFFFFFFF);
    }

    private void startListening() {
        if (!SpeechRecognizer.isRecognitionAvailable(this)) {
            Toast.makeText(this, "Speech recognition tidak tersedia di perangkat ini.", Toast.LENGTH_SHORT).show();
            dialogStatusText.setText("Gunakan mode edit di bawah.");
            switchToEditMode();
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
                dialogStatusText.setText("Mendengarkan... Silakan bicara");
            }

            @Override
            public void onBeginningOfSpeech() {
                dialogStatusText.setText("Merekam suara...");
            }

            @Override
            public void onRmsChanged(float rmsdB) {}

            @Override
            public void onBufferReceived(byte[] buffer) {}

            @Override
            public void onEndOfSpeech() {
                dialogStatusText.setText("Memproses kata...");
            }

            @Override
            public void onError(int error) {
                if (!isEditMode) {
                    dialogStatusText.setText("Ketuk mic untuk coba lagi atau tekan Edit");
                }
            }

            @Override
            public void onResults(Bundle results) {
                ArrayList<String> matches = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                if (matches != null && !matches.isEmpty()) {
                    processSpeechResult(matches.get(0));
                }
                if (currentAmount > 0) {
                    dialogStatusText.setText("Terdeteksi! Tekan Simpan");
                } else {
                    dialogStatusText.setText("Nominal belum terdeteksi. Silakan coba lagi / Edit.");
                }
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
        dialogTranscriptText.setText("\"" + currentTranscript + "\"");

        parseTransaction(currentTranscript);

        DecimalFormat formatter = new DecimalFormat("#,###", new DecimalFormatSymbols(Locale.GERMANY));
        String formattedNominal = "Rp " + formatter.format(currentAmount);
        dialogNominalText.setText(formattedNominal);

        dialogCategoryText.setText(currentCategoryLabel);

        if ("income".equals(currentType)) {
            dialogTypeText.setText("Pemasukan");
            dialogTypeText.setTextColor(0xFF4ADE80);
            dialogNominalText.setTextColor(0xFF4ADE80);
        } else {
            dialogTypeText.setText("Pengeluaran");
            dialogTypeText.setTextColor(0xFFF87171);
            dialogNominalText.setTextColor(0xFF34D399);
        }
    }

    private void parseTransaction(String input) {
        String lower = input.toLowerCase();

        // 1. Determine Type & Category
        boolean isIncome = lower.contains("ditransfer") ||
                           lower.contains("dapat transfer") ||
                           lower.contains("terima transfer") ||
                           lower.contains("transfer masuk") ||
                           (lower.contains("transfer") && !lower.contains("transfer ke") && !lower.contains("transfer buat") && !lower.contains("transfer untuk")) ||
                           lower.contains("gaji") || lower.contains("gajian") || lower.contains("salary") ||
                           lower.contains("bonus") || lower.contains("pemasukan") || lower.contains("pendapatan") ||
                           lower.contains("dikirimi") || lower.contains("dikirimin") || lower.contains("kiriman") ||
                           lower.contains("dapat uang") || lower.contains("dapet uang") || lower.contains("dikasih uang") ||
                           lower.contains("dikasih") || lower.contains("terima uang") || lower.contains("uang masuk") ||
                           lower.contains("komisi") || lower.contains("cair") || lower.contains("thr") ||
                           lower.contains("angpao") || lower.contains("cashback") || lower.contains("refund") ||
                           lower.contains("upah") || lower.contains("honor");

        if (isIncome) {
            currentType = "income";
            currentCategory = "salary";
            currentCategoryLabel = "Pemasukan";
        } else {
            currentType = "expense";

            // CHECK FOOD FIRST (Food & Drink is the primary daily transaction)
            if (lower.contains("makan") || lower.contains("minum") || lower.contains("roti") ||
                lower.contains("bakso") || lower.contains("mie") || lower.contains("nasi") ||
                lower.contains("ayam") || lower.contains("sate") || lower.contains("soto") ||
                lower.contains("kopi") || lower.contains("coffee") || lower.contains("es teh") ||
                lower.contains("teh") || lower.contains("snack") || lower.contains("cemilan") ||
                lower.contains("jajan") || lower.contains("cafe") || lower.contains("kafe") ||
                lower.contains("warung") || lower.contains("warkop") || lower.contains("indomie") ||
                lower.contains("burger") || lower.contains("pizza") || lower.contains("martabak") ||
                lower.contains("gorengan") || lower.contains("sarapan") || lower.contains("siang") ||
                lower.contains("jus") || lower.contains("buah") || lower.contains("sayur") ||
                lower.contains("daging") || lower.contains("telur") || lower.contains("beras")) {
                currentCategory = "food";
                currentCategoryLabel = "Makanan & Minuman";
            } else if (lower.contains("bensin") || lower.contains("pertalite") || lower.contains("pertamax") ||
                       lower.contains("solar") || lower.contains("gojek") || lower.contains("gocar") ||
                       lower.contains("grab") || lower.contains("ojol") || lower.contains("ojek") ||
                       lower.contains("maxim") || lower.contains("indrive") || lower.contains("parkir") ||
                       lower.contains("tol") || lower.contains("angkot") || lower.contains("kereta") ||
                       lower.contains("krl") || lower.contains("mrt") || lower.contains("lrt") ||
                       lower.contains("bus") || lower.contains("ongkir") || lower.contains("tambal ban")) {
                currentCategory = "transport";
                currentCategoryLabel = "Transportasi";
            } else if (lower.contains("pulsa") || lower.contains("listrik") || lower.contains("token") ||
                       lower.contains("wifi") || lower.contains("pdam") || lower.contains("air") ||
                       lower.contains("bpjs") || lower.contains("kuota") || lower.contains("paket data") ||
                       lower.contains("kos") || lower.contains("kost") || lower.contains("kontrakan") ||
                       lower.contains("cicilan") || lower.contains("iuran")) {
                currentCategory = "bills";
                currentCategoryLabel = "Tagihan";
            } else if (lower.contains("bioskop") || lower.contains("nonton") || lower.contains("cinema") ||
                       lower.contains("cgv") || lower.contains("xxi") || lower.contains("game") ||
                       lower.contains("top up") || lower.contains("topup") || lower.contains("diamond") ||
                       lower.contains("steam") || lower.contains("liburan") || lower.contains("karaoke") ||
                       lower.contains("wisata") || lower.contains("pantai") || lower.contains("netflix") ||
                       lower.contains("spotify")) {
                currentCategory = "entertainment";
                currentCategoryLabel = "Hiburan";
            } else if (lower.contains("baju") || lower.contains("sepatu") || lower.contains("celana") ||
                       lower.contains("kaos") || lower.contains("jaket") || lower.contains("tas") ||
                       lower.contains("dompet") || lower.contains("sandal") || lower.contains("skincare") ||
                       lower.contains("makeup") || lower.contains("kosmetik") || lower.contains("shopee") ||
                       lower.contains("tokopedia") || lower.contains("lazada") || lower.contains("tiktok shop") ||
                       lower.contains("mall") || lower.contains("belanja")) {
                currentCategory = "shopping";
                currentCategoryLabel = "Belanja";
            } else {
                currentCategory = "food";
                currentCategoryLabel = "Makanan & Minuman";
            }
        }

        // 2. Extract Amount using comprehensive parser
        currentAmount = extractIndonesianAmount(lower);
    }

    public static long extractIndonesianAmount(String input) {
        if (input == null || input.trim().isEmpty()) return 0;

        // Normalize currency prefixes (e.g. "Rp6.000", "Rp. 6.000", "IDR 6000", "Rp 6000")
        String text = input.toLowerCase()
            .replaceAll("(?i)(?:rp|idr|rupiah)\\.?\\s*", " ")
            .replaceAll("\\s+", " ")
            .trim();

        // Regex Pattern 1: e.g. "1.5 juta", "2 juta", "1 jt"
        Pattern pJuta = Pattern.compile("(\\d+(?:[.,]\\d+)?)\\s*(?:juta|jt|million)\\b");
        Matcher mJuta = pJuta.matcher(text);
        if (mJuta.find()) {
            try {
                double val = Double.parseDouble(mJuta.group(1).replace(",", "."));
                return (long) (val * 1000000);
            } catch (Exception ignored) {}
        }

        // Regex Pattern 2: e.g. "10 ribu", "30rb", "25k", "6 rebu"
        Pattern pRibu = Pattern.compile("(\\d+(?:[.,]\\d+)?)\\s*(?:ribu|rb|rebu|k\\b|thousand)");
        Matcher mRibu = pRibu.matcher(text);
        if (mRibu.find()) {
            try {
                double val = Double.parseDouble(mRibu.group(1).replace(",", "."));
                return (long) (val * 1000);
            } catch (Exception ignored) {}
        }

        // Regex Pattern 3: Plain or formatted numbers e.g. "6.000", "25000", "25.000", "10000", "30000"
        Pattern pPlain = Pattern.compile("(?:^|\\s|[a-z])(\\d{1,3}(?:[.,]\\d{3})+|\\d{4,9})(?:\\s|[a-z]|$)");
        Matcher mPlain = pPlain.matcher(text);
        if (mPlain.find()) {
            try {
                return Long.parseLong(mPlain.group(1).replace(".", "").replace(",", ""));
            } catch (Exception ignored) {}
        }

        // Normalize Indonesian Slang & Halves before token evaluation
        String normalized = text
            .replaceAll("\\bcepek\\s*(?:ceng|ribu|rb)\\b", "100 ribu")
            .replaceAll("\\bgopek\\s*(?:ceng|ribu|rb)\\b", "500 ribu")
            .replaceAll("\\bgoceng\\b", "5 ribu")
            .replaceAll("\\bceban\\b", "10 ribu")
            .replaceAll("\\bgoban\\b", "50 ribu")
            .replaceAll("\\bseceng\\b", "1 ribu")
            .replaceAll("\\bnoceng\\b", "2 ribu")
            .replaceAll("\\bnoban\\b", "20 ribu")
            .replaceAll("\\bcapceng\\b", "10 ribu")
            .replaceAll("\\bsetengah\\s+juta\\b", "500 ribu")
            .replaceAll("\\bsetengah\\s+ribu\\b", "500");

        // Parse token by token for Indonesian spoken numbers (e.g. "sepuluh ribu", "tiga puluh ribu", "dua puluh lima ribu")
        String[] tokens = normalized.replaceAll("[^a-z0-9\\s]", " ").trim().split("\\s+");
        long total = 0;
        long current = 0;
        boolean seen = false;

        for (String t : tokens) {
            if (t.equals("dan")) continue;

            if (t.matches("^\\d+$")) {
                try {
                    long num = Long.parseLong(t);
                    current += num;
                    seen = true;
                    continue;
                } catch (Exception ignored) {}
            }

            if (t.equals("nol")) { seen = true; continue; }
            if (t.equals("satu")) { current += 1; seen = true; continue; }
            if (t.equals("dua")) { current += 2; seen = true; continue; }
            if (t.equals("tiga")) { current += 3; seen = true; continue; }
            if (t.equals("empat")) { current += 4; seen = true; continue; }
            if (t.equals("lima")) { current += 5; seen = true; continue; }
            if (t.equals("enam")) { current += 6; seen = true; continue; }
            if (t.equals("tujuh")) { current += 7; seen = true; continue; }
            if (t.equals("delapan")) { current += 8; seen = true; continue; }
            if (t.equals("sembilan")) { current += 9; seen = true; continue; }

            if (t.equals("sepuluh")) { current += 10; seen = true; continue; }
            if (t.equals("sebelas")) { current += 11; seen = true; continue; }
            if (t.equals("belas")) {
                if (current == 0) current = 10;
                else current += 10;
                seen = true;
                continue;
            }

            if (t.equals("puluh")) {
                current = (current == 0 ? 1 : current) * 10;
                seen = true;
                continue;
            }

            if (t.equals("seratus")) { current += 100; seen = true; continue; }
            if (t.equals("ratus")) {
                current = (current == 0 ? 1 : current) * 100;
                seen = true;
                continue;
            }

            if (t.equals("seribu")) {
                total += 1000;
                current = 0;
                seen = true;
                continue;
            }
            if (t.equals("ribu") || t.equals("rb") || t.equals("rebu") || t.equals("k")) {
                long base = current == 0 ? 1 : current;
                total += base * 1000;
                current = 0;
                seen = true;
                continue;
            }

            if (t.equals("sejuta")) {
                total += 1000000;
                current = 0;
                seen = true;
                continue;
            }
            if (t.equals("juta") || t.equals("jt")) {
                long base = current == 0 ? 1 : current;
                total += base * 1000000;
                current = 0;
                seen = true;
                continue;
            }
        }

        long calculated = total + current;
        if (seen && calculated > 0) {
            return calculated;
        }

        return 0; // ZERO fallback. Never assume 25000!
    }

    private void saveFromEditAndClose() {
        String amountStr = editAmountInput.getText().toString().trim();
        if (amountStr.isEmpty()) {
            Toast.makeText(this, "Silakan masukkan nominal transaksi.", Toast.LENGTH_SHORT).show();
            return;
        }

        try {
            currentAmount = Long.parseLong(amountStr);
        } catch (Exception e) {
            Toast.makeText(this, "Nominal angka tidak valid.", Toast.LENGTH_SHORT).show();
            return;
        }

        String note = editNoteInput.getText().toString().trim();
        currentTranscript = note.isEmpty() ? currentCategoryLabel : note;

        executeSaveAndDismiss();
    }

    private void saveTransactionAndClose() {
        if (currentAmount <= 0) {
            Toast.makeText(this, "Nominal belum terdeteksi. Tekan Edit untuk isi nominal.", Toast.LENGTH_SHORT).show();
            switchToEditMode();
            return;
        }
        executeSaveAndDismiss();
    }

    private void executeSaveAndDismiss() {
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
            tx.put("method", isEditMode ? "widget_edit" : "widget_voice");

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

        dismissCleanly();
    }

    private void dismissCleanly() {
        if (speechRecognizer != null) {
            try {
                speechRecognizer.destroy();
            } catch (Exception ignored) {}
            speechRecognizer = null;
        }
        finishAndRemoveTask();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (speechRecognizer != null) {
            try {
                speechRecognizer.destroy();
            } catch (Exception ignored) {}
            speechRecognizer = null;
        }
    }
}
