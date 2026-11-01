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
    }

    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        checkVoiceIntent(intent);
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
        }
    }
}
