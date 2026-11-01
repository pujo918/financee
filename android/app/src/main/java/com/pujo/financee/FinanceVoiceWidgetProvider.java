package com.pujo.financee;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

public class FinanceVoiceWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        SharedPreferences prefs = context.getSharedPreferences("FinanceWidgetPrefs", Context.MODE_PRIVATE);
        String theme = prefs.getString("theme", "onepiece");
        String transcript = prefs.getString("lastTranscript", "\"Ketuk mic untuk bicara\"");
        String nominal = prefs.getString("lastNominal", "Rp 0");
        String category = prefs.getString("lastCategory", "Makanan");
        String type = prefs.getString("lastType", "Pengeluaran");

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.finance_widget_large_layout);

        // Update Theme Avatar & Glow Accent
        if ("naruto".equalsIgnoreCase(theme)) {
            views.setImageViewResource(R.id.widgetLargeAvatar, R.drawable.avatar_naruto);
            views.setInt(R.id.widgetLargeMicGlow, "setBackgroundResource", R.drawable.widget_glow_mic_orange);
        } else {
            views.setImageViewResource(R.id.widgetLargeAvatar, R.drawable.avatar_luffy);
            views.setInt(R.id.widgetLargeMicGlow, "setBackgroundResource", R.drawable.widget_glow_mic_cyan);
        }

        // Update Text Fields
        if (!transcript.startsWith("\"")) {
            transcript = "\"" + transcript + "\"";
        }
        views.setTextViewText(R.id.widgetLargeTranscriptText, transcript);
        views.setTextViewText(R.id.widgetLargeNominalText, nominal);
        views.setTextViewText(R.id.widgetLargeCategoryText, category);
        views.setTextViewText(R.id.widgetLargeTypeText, type);

        if ("Pemasukan".equalsIgnoreCase(type)) {
            views.setTextColor(R.id.widgetLargeTypeText, 0xFF4ADE80);
            views.setTextColor(R.id.widgetLargeNominalText, 0xFF4ADE80);
        } else {
            views.setTextColor(R.id.widgetLargeTypeText, 0xFFF87171);
            views.setTextColor(R.id.widgetLargeNominalText, 0xFF34D399);
        }

        // Click on Mic Button -> Launch VoiceDialogActivity (Floating Dialog over Home Screen)
        Intent voiceDialogIntent = new Intent(context, VoiceDialogActivity.class);
        voiceDialogIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent voiceDialogPendingIntent = PendingIntent.getActivity(
            context, 201, voiceDialogIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widgetLargeMicButton, voiceDialogPendingIntent);

        // Click on "Simpan" Button on Widget -> Also triggers voice dialog if needed
        views.setOnClickPendingIntent(R.id.widgetLargeSaveButton, voiceDialogPendingIntent);

        // Click on "Edit" Button on Widget -> Open MainActivity Dashboard
        Intent openAppIntent = new Intent(context, MainActivity.class);
        openAppIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent openAppPendingIntent = PendingIntent.getActivity(
            context, 202, openAppIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widgetLargeEditButton, openAppPendingIntent);

        // Click on Card Root -> Open App Dashboard
        views.setOnClickPendingIntent(R.id.widgetLargeRootLayout, openAppPendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    public static void updateAllWidgets(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        ComponentName componentName = new ComponentName(context, FinanceVoiceWidgetProvider.class);
        int[] ids = manager.getAppWidgetIds(componentName);
        if (ids != null && ids.length > 0) {
            for (int id : ids) {
                updateAppWidget(context, manager, id);
            }
        }
    }
}