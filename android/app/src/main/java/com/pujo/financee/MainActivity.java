package com.pujo.financee;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().addJavascriptInterface(new WidgetBridge(this), "AndroidWidget");

            bridge.getWebView().setWebChromeClient(new WebChromeClient() {
                @Override
                public void onPermissionRequest(final PermissionRequest request) {
                    runOnUiThread(() -> {
                        request.grant(request.getResources());
                    });
                }
            });
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        checkVoiceIntent(getIntent());
        syncPendingWidgetTransactions();
    }

    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        checkVoiceIntent(intent);
        syncPendingWidgetTransactions();
    }

    private void syncPendingWidgetTransactions() {
        if (bridge == null || bridge.getWebView() == null) return;

        SharedPreferences prefs = getSharedPreferences("FinanceWidgetPrefs", Context.MODE_PRIVATE);
        String pending = prefs.getString("pendingTransactions", "[]");
        if (pending != null && !pending.equals("[]") && !pending.trim().isEmpty()) {
            bridge.getWebView().postDelayed(() -> {
                bridge.getWebView().evaluateJavascript(
                    "if (typeof window.syncPendingTransactionsFromWidget === 'function') { window.syncPendingTransactionsFromWidget(); }",
                    null
                );
            }, 600);
        }
    }

    private void checkVoiceIntent(Intent intent) {
        if (intent == null) return;
        boolean isVoice = "ACTION_VOICE_INPUT".equals(intent.getAction());
        Uri data = intent.getData();
        if (data != null && "financee".equals(data.getScheme()) && "voice".equals(data.getHost())) {
            isVoice = true;
        }

        if (isVoice && bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().postDelayed(() -> {
                bridge.getWebView().evaluateJavascript(
                    "if (typeof window.toggleVoiceInput === 'function' && !window.isListening) { window.toggleVoiceInput(); }",
                    null
                );
            }, 800);
        }
    }

    public static class WidgetBridge {
        private final Context context;

        public WidgetBridge(Context context) {
            this.context = context;
        }

        @JavascriptInterface
        public void updateWidget(String balance, String income, String expense) {
            SharedPreferences prefs = context.getSharedPreferences("FinanceWidgetPrefs", Context.MODE_PRIVATE);
            prefs.edit()
                .putString("monthlyBalance", balance)
                .putString("monthlyIncome", income)
                .putString("monthlyExpense", expense)
                .putLong("lastUpdated", System.currentTimeMillis())
                .apply();

            FinanceWidgetProvider.updateAllWidgets(context);
            FinanceVoiceWidgetProvider.updateAllWidgets(context);
        }

        @JavascriptInterface
        public void updateWidgetFull(String balance, String income, String expense, String theme, String lastTranscript, String lastNominal, String lastCategory, String lastType) {
            SharedPreferences prefs = context.getSharedPreferences("FinanceWidgetPrefs", Context.MODE_PRIVATE);
            prefs.edit()
                .putString("monthlyBalance", balance)
                .putString("monthlyIncome", income)
                .putString("monthlyExpense", expense)
                .putString("theme", theme)
                .putString("lastTranscript", lastTranscript)
                .putString("lastNominal", lastNominal)
                .putString("lastCategory", lastCategory)
                .putString("lastType", lastType)
                .putLong("lastUpdated", System.currentTimeMillis())
                .apply();

            FinanceWidgetProvider.updateAllWidgets(context);
            FinanceVoiceWidgetProvider.updateAllWidgets(context);
        }

        @JavascriptInterface
        public void setTheme(String theme) {
            SharedPreferences prefs = context.getSharedPreferences("FinanceWidgetPrefs", Context.MODE_PRIVATE);
            prefs.edit().putString("theme", theme).apply();
            FinanceWidgetProvider.updateAllWidgets(context);
            FinanceVoiceWidgetProvider.updateAllWidgets(context);
        }

        @JavascriptInterface
        public String getPendingTransactions() {
            SharedPreferences prefs = context.getSharedPreferences("FinanceWidgetPrefs", Context.MODE_PRIVATE);
            return prefs.getString("pendingTransactions", "[]");
        }

        @JavascriptInterface
        public void clearPendingTransactions() {
            SharedPreferences prefs = context.getSharedPreferences("FinanceWidgetPrefs", Context.MODE_PRIVATE);
            prefs.edit().putString("pendingTransactions", "[]").apply();
        }
    }
}