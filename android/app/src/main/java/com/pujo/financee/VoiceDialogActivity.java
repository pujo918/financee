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

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
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
    private TextView catStudy;
    private TextView catHealth;
    private TextView catEntertainment;
    private TextView catOther;
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
        catStudy = findViewById(R.id.catStudy);
        catHealth = findViewById(R.id.catHealth);
        catEntertainment = findViewById(R.id.catEntertainment);
        catOther = findViewById(R.id.catOther);
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
        catFood.setOnClickListener(v -> selectCategory("food", "Makanan", "expense"));
        catTransport.setOnClickListener(v -> selectCategory("transport", "Transport", "expense"));
        catBills.setOnClickListener(v -> selectCategory("bills", "Tagihan", "expense"));
        catShopping.setOnClickListener(v -> selectCategory("shopping", "Belanja", "expense"));
        catStudy.setOnClickListener(v -> selectCategory("study", "Pendidikan", "expense"));
        catHealth.setOnClickListener(v -> selectCategory("health", "Kesehatan", "expense"));
        catEntertainment.setOnClickListener(v -> selectCategory("entertainment", "Hiburan", "expense"));
        catOther.setOnClickListener(v -> selectCategory("other", "Lainnya", "expense"));
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
        resetChip(catStudy);
        resetChip(catHealth);
        resetChip(catEntertainment);
        resetChip(catOther);
        resetChip(catSalary);

        if ("salary".equals(currentCategory)) {
            highlightChip(catSalary);
        } else if ("transport".equals(currentCategory)) {
            highlightChip(catTransport);
        } else if ("bills".equals(currentCategory)) {
            highlightChip(catBills);
        } else if ("shopping".equals(currentCategory)) {
            highlightChip(catShopping);
        } else if ("study".equals(currentCategory)) {
            highlightChip(catStudy);
        } else if ("health".equals(currentCategory)) {
            highlightChip(catHealth);
        } else if ("entertainment".equals(currentCategory)) {
            highlightChip(catEntertainment);
        } else if ("other".equals(currentCategory)) {
            highlightChip(catOther);
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

    private boolean matchesKw(String text, String kw) {
        if (text == null || kw == null || kw.trim().isEmpty()) return false;
        String k = kw.trim().toLowerCase();
        if (k.contains(" ")) {
            return text.contains(k);
        }
        Pattern p = Pattern.compile("\\b" + Pattern.quote(k) + "\\b", Pattern.CASE_INSENSITIVE);
        return p.matcher(text).find();
    }

    private boolean matchesAny(String text, String... keywords) {
        for (String kw : keywords) {
            if (matchesKw(text, kw)) return true;
        }
        return false;
    }

    private void parseTransaction(String input) {
        String lower = input.toLowerCase();

        // 1. Determine Type & Category (1:1 with web app voice-parser.js)
        boolean isIncome = matchesAny(lower,
            "ditransfer", "dapat transfer", "terima transfer", "transfer masuk",
            "dikirimi", "dikirimin", "kiriman", "dapat uang", "dapet uang", "dikasih uang",
            "uang masuk", "komisi", "cair", "thr", "angpao", "cashback", "refund",
            "gaji", "gajian", "salary", "bonus", "pemasukan", "pendapatan",
            "upah", "honor", "proyek", "freelance"
        );
        if (!isIncome && lower.contains("transfer") && !lower.contains("transfer ke") && !lower.contains("transfer buat") && !lower.contains("transfer untuk") && !lower.contains("transfer bayar")) {
            isIncome = true;
        }

        if (isIncome) {
            currentType = "income";
            currentCategory = "salary";
            currentCategoryLabel = "Pemasukan";
        } else {
            currentType = "expense";

            // Order matches voice-parser.js: bills -> transport -> study -> health -> entertainment -> food -> shopping -> other
            if (matchesAny(lower,
                "listrik", "electricity", "token", "pln", "air", "pdam",
                "wifi", "internet", "indihome", "biznet", "myrepublic", "first media",
                "pulsa", "paket data", "kuota", "telkomsel", "indosat", "xl", "tri", "smartfren",
                "bpjs", "asuransi", "premi", "sewa", "rent", "kos", "kost", "uang kos", "kontrakan", "apartment", "apartemen",
                "cicilan", "iuran", "pbb", "pajak", "tagihan", "bills", "bill"
            )) {
                currentCategory = "bills";
                currentCategoryLabel = "Tagihan";
            } else if (matchesAny(lower,
                "bensin", "pertalite", "pertamax", "solar", "diesel", "spbu", "shell", "fuel",
                "gojek", "goride", "gocar", "grab", "grabike", "grabcar", "ojol", "ojek", "maxim", "indrive", "taksi", "taxi",
                "parkir", "parking", "tol", "toll", "e-toll", "etoll", "angkot", "mikrolet", "minibus",
                "bus", "transjakarta", "busway", "kereta", "krl", "commuter line", "mrt", "lrt", "train",
                "pesawat", "tiket pesawat", "airport", "bandara",
                "bengkel", "tambal ban", "service motor", "service mobil", "cuci motor", "cuci mobil", "ongkir"
            )) {
                currentCategory = "transport";
                currentCategoryLabel = "Transport";
            } else if (matchesAny(lower,
                "buku", "beli buku", "ebook", "novel", "modul", "materi", "diktat", "buku tulis", "textbook", "book", "stationery",
                "fotokopi", "print", "cetak", "printing", "photocopy",
                "pensil", "pencil", "pulpen", "pen", "pena", "penghapus", "penggaris", "stabilo", "spidol", "binder", "kertas",
                "les", "bimbel", "kursus", "tutoring", "privat", "kelas", "course", "workshop", "pelatihan", "training", "bootcamp", "seminar", "webinar", "sertifikasi",
                "ai", "chatgpt", "openai", "gemini", "claude", "langganan ai", "tools ai", "aplikasi belajar",
                "sekolah", "school", "kuliah", "college", "kampus", "campus", "university", "spp", "uang sekolah", "uang kuliah", "ukt", "tuition",
                "ujian", "exam", "pendaftaran", "belajar", "study", "pendidikan", "education"
            )) {
                currentCategory = "study";
                currentCategoryLabel = "Pendidikan";
            } else if (matchesAny(lower,
                "obat", "medicine", "resep dokter", "apotek", "apotik", "pharmacy",
                "vitamin", "vitamins", "suplemen", "tablet", "kapsul", "sirup", "antibiotik", "jamu", "herbal",
                "dokter", "doctor", "dokter gigi", "dentist", "klinik", "clinic", "rumah sakit", "hospital", "rs", "puskesmas",
                "cek kesehatan", "check up", "medical check up", "tes darah", "vaksin", "vaccine",
                "gym", "fitness", "workout", "yoga", "pilates", "lari", "sepeda", "renang", "badminton", "futsal",
                "terapi", "konseling", "psikolog", "psikiater", "spa", "pijat", "massage", "refleksi", "salon", "barbershop", "potong rambut",
                "kesehatan", "health"
            )) {
                currentCategory = "health";
                currentCategoryLabel = "Kesehatan";
            } else if (matchesAny(lower,
                "bioskop", "nonton", "cinema", "cgv", "xxi", "movie", "film",
                "netflix", "disney", "prime video", "spotify", "apple music", "youtube premium", "streaming",
                "game", "gaming", "top up", "topup", "diamond", "uc", "voucher game", "gacha", "skin", "battle pass",
                "steam", "playstation", "ps5", "ps4", "xbox", "nintendo", "switch", "mobile legends", "free fire", "pubg", "valorant",
                "liburan", "holiday", "traveling", "travel", "wisata", "piknik", "staycation", "pantai", "gunung", "resort", "hotel", "villa", "dufan",
                "karaoke", "party", "konser", "tiket konser", "hiburan"
            )) {
                currentCategory = "entertainment";
                currentCategoryLabel = "Hiburan";
            } else if (matchesAny(lower,
                "makan", "minum", "sarapan", "lunch", "dinner", "breakfast", "jajan", "cemilan", "snack",
                "roti", "bread", "kopi", "coffee", "ngopi", "teh", "tea", "es teh", "jus", "juice", "air mineral",
                "bakso", "mie", "nasi", "nasi goreng", "mie goreng", "mie ayam", "ayam", "ayam goreng", "ayam bakar",
                "sate", "soto", "rendang", "rawon", "pecel", "indomie", "warteg", "padang", "mcd", "mcdonalds", "kfc",
                "burger", "pizza", "martabak", "gorengan", "es krim", "ice cream",
                "cafe", "kafe", "resto", "restaurant", "warung", "warkop",
                "sayur", "buah", "daging", "telur", "beras", "groceries", "belanja dapur"
            )) {
                currentCategory = "food";
                currentCategoryLabel = "Makanan";
            } else if (matchesAny(lower,
                "baju", "pakaian", "clothes", "kaos", "kemeja", "celana", "jeans", "jaket", "hoodie", "sweater", "dress", "rok", "gamis", "hijab",
                "sepatu", "shoes", "sneakers", "sandal", "tas", "bag", "backpack", "dompet", "wallet", "topi", "jam tangan", "kacamata",
                "skincare", "sabun", "sampo", "shampoo", "pasta gigi", "parfum", "kosmetik", "makeup", "lipstick", "lotion", "sunscreen",
                "belanja", "shopping", "mall", "supermarket", "tokopedia", "shopee", "lazada", "tiktok shop", "indomaret", "alfamart",
                "hp", "handphone", "smartphone", "iphone", "android", "laptop", "macbook", "pc", "mouse", "keyboard", "headset", "earphone", "tws", "charger", "powerbank", "gadget"
            )) {
                currentCategory = "shopping";
                currentCategoryLabel = "Belanja";
            } else {
                currentCategory = "other";
                currentCategoryLabel = "Lainnya";
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

    private static final String SHEET_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbyqnT0jfZwiKwQzM4NLM-zOUEIzL_9ZlsDg4_Bg8tLk9334A_eMIfAHgHG8IHUPSwzbRA/exec";

    private void executeSaveAndDismiss() {
        try {
            SharedPreferences prefs = getSharedPreferences("FinanceWidgetPrefs", Context.MODE_PRIVATE);

            // 1. Build Transaction JSON
            JSONObject tx = new JSONObject();
            long now = System.currentTimeMillis();
            String dateStr = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(new Date(now));
            String monthStr = dateStr.length() >= 7 ? dateStr.substring(0, 7) : "";
            String desc = currentTranscript.isEmpty() ? currentCategoryLabel : currentTranscript;

            tx.put("id", now);
            tx.put("type", currentType);
            tx.put("amount", currentAmount);
            tx.put("category", currentCategory);
            tx.put("date", dateStr);
            tx.put("description", desc);
            tx.put("method", isEditMode ? "widget_edit" : "widget_voice");
            tx.put("syncedToSheet", false);

            // 2. Append to pending queue in SharedPreferences
            String pendingJson = prefs.getString("pendingTransactions", "[]");
            JSONArray pending = new JSONArray(pendingJson);
            pending.put(tx);

            // 3. Update Widget Display Data
            DecimalFormat formatter = new DecimalFormat("#,###", new DecimalFormatSymbols(Locale.GERMANY));
            String nominalFormatted = "Rp " + formatter.format(currentAmount);

            prefs.edit()
                .putString("pendingTransactions", pending.toString())
                .putString("lastTranscript", desc)
                .putString("lastNominal", nominalFormatted)
                .putString("lastCategory", currentCategoryLabel)
                .putString("lastType", "income".equals(currentType) ? "Pemasukan" : "Pengeluaran")
                .putLong("lastUpdated", now)
                .apply();

            // 4. Trigger Widget Update for both 4x2 and 4x1
            FinanceWidgetProvider.updateAllWidgets(this);
            FinanceVoiceWidgetProvider.updateAllWidgets(this);

            // 5. DIRECT BACKGROUND SYNC TO GOOGLE SPREADSHEET
            syncDirectlyToGoogleSheet(now, dateStr, monthStr, currentType, currentCategory, desc, currentAmount, isEditMode ? "widget_edit" : "widget_voice");

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

    private void syncDirectlyToGoogleSheet(long id, String date, String month, String type, String category, String description, long amount, String source) {
        new Thread(() -> {
            HttpURLConnection conn = null;
            try {
                JSONObject payload = new JSONObject();
                payload.put("action", "add");
                payload.put("id", id);
                payload.put("date", date);
                payload.put("month", month);
                payload.put("type", type);
                payload.put("category", category);
                payload.put("description", description);
                payload.put("amount", amount);
                payload.put("source", source);

                byte[] postData = payload.toString().getBytes(StandardCharsets.UTF_8);

                URL url = new URL(SHEET_WEBAPP_URL);
                conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "text/plain;charset=utf-8");
                conn.setRequestProperty("Content-Length", String.valueOf(postData.length));
                conn.setDoOutput(true);
                conn.setConnectTimeout(15000);
                conn.setReadTimeout(15000);
                conn.setInstanceFollowRedirects(true);

                try (OutputStream os = conn.getOutputStream()) {
                    os.write(postData);
                    os.flush();
                }

                int responseCode = conn.getResponseCode();
                android.util.Log.d("VoiceDialog", "Google Sheet sync response code: " + responseCode);

                if (responseCode == HttpURLConnection.HTTP_MOVED_TEMP || responseCode == HttpURLConnection.HTTP_MOVED_PERM || responseCode == 307) {
                    String redirectUrl = conn.getHeaderField("Location");
                    if (redirectUrl != null) {
                        HttpURLConnection redirConn = (HttpURLConnection) new URL(redirectUrl).openConnection();
                        redirConn.setRequestMethod("GET");
                        redirConn.setConnectTimeout(10000);
                        redirConn.setReadTimeout(10000);
                        redirConn.getResponseCode();
                        redirConn.disconnect();
                    }
                }

                if (responseCode >= 200 && responseCode < 400) {
                    markTransactionAsSyncedInPrefs(id);
                }
            } catch (Exception e) {
                android.util.Log.e("VoiceDialog", "Failed to sync to Google Sheet from widget", e);
            } finally {
                if (conn != null) {
                    conn.disconnect();
                }
            }
        }).start();
    }

    private void markTransactionAsSyncedInPrefs(long id) {
        try {
            SharedPreferences prefs = getSharedPreferences("FinanceWidgetPrefs", Context.MODE_PRIVATE);
            String pendingJson = prefs.getString("pendingTransactions", "[]");
            JSONArray pending = new JSONArray(pendingJson);
            boolean updated = false;
            for (int i = 0; i < pending.length(); i++) {
                JSONObject obj = pending.getJSONObject(i);
                if (obj.optLong("id") == id) {
                    obj.put("syncedToSheet", true);
                    updated = true;
                }
            }
            if (updated) {
                prefs.edit().putString("pendingTransactions", pending.toString()).apply();
            }
        } catch (Exception ignored) {}
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
