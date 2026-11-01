package com.pujo.financee;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.util.Log;
import android.view.View;
import android.widget.RemoteViews;

public class FinanceVoiceWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        try {
            SharedPreferences prefs = context.getSharedPreferences("FinanceWidgetPrefs", Context.MODE_PRIVATE);
            String theme = prefs.getString("theme", "onepiece");
            String transcript = prefs.getString("lastTranscript", "\"Ketuk mic untuk bicara\"");
            String nominal = prefs.getString("lastNominal", "Rp 0");
            String category = prefs.getString("lastCategory", "Makanan");
            String type = prefs.getString("lastType", "Pengeluaran");

            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.finance_widget_large_layout);

            // Update Theme Avatar, Background, Badge, and Glow Accent
            if ("naruto".equalsIgnoreCase(theme)) {
                // Naruto Theme Active
                views.setViewVisibility(R.id.widgetLargeBgNaruto, View.VISIBLE);
                views.setViewVisibility(R.id.widgetLargeBgOnePiece, View.GONE);

                views.setViewVisibility(R.id.widgetLargeArtNaruto, View.VISIBLE);
                views.setViewVisibility(R.id.widgetLargeArtOnePiece, View.GONE);

                views.setViewVisibility(R.id.widgetAvatarNaruto, View.VISIBLE);
                views.setViewVisibility(R.id.widgetAvatarLuffy, View.GONE);

                views.setViewVisibility(R.id.widgetThemeBadgeNaruto, View.VISIBLE);
                views.setViewVisibility(R.id.widgetThemeBadgeOnePiece, View.GONE);

                views.setViewVisibility(R.id.widgetLargeMicGlowOrange, View.VISIBLE);
                views.setViewVisibility(R.id.widgetLargeMicGlowCyan, View.GONE);
            } else {
                // One Piece Theme Active (Default)
                views.setViewVisibility(R.id.widgetLargeBgOnePiece, View.VISIBLE);
                views.setViewVisibility(R.id.widgetLargeBgNaruto, View.GONE);

                views.setViewVisibility(R.id.widgetLargeArtOnePiece, View.VISIBLE);
                views.setViewVisibility(R.id.widgetLargeArtNaruto, View.GONE);

                views.setViewVisibility(R.id.widgetAvatarLuffy, View.VISIBLE);
                views.setViewVisibility(R.id.widgetAvatarNaruto, View.GONE);

                views.setViewVisibility(R.id.widgetThemeBadgeOnePiece, View.VISIBLE);
                views.setViewVisibility(R.id.widgetThemeBadgeNaruto, View.GONE);

                views.setViewVisibility(R.id.widgetLargeMicGlowCyan, View.VISIBLE);
                views.setViewVisibility(R.id.widgetLargeMicGlowOrange, View.GONE);
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

            // 1. Mic Button -> Launch VoiceDialogActivity (Floating Voice Popup)
            Intent voiceIntent = new Intent(context, VoiceDialogActivity.class);
            voiceIntent.putExtra(VoiceDialogActivity.EXTRA_START_IN_EDIT_MODE, false);
            voiceIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_MULTIPLE_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent voicePendingIntent = PendingIntent.getActivity(
                context, 201, voiceIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            views.setOnClickPendingIntent(R.id.widgetLargeMicButton, voicePendingIntent);

            // 2. Simpan Button -> Launch VoiceDialogActivity
            views.setOnClickPendingIntent(R.id.widgetLargeSaveButton, voicePendingIntent);

            // 3. EDIT Button -> Launch VoiceDialogActivity in INLINE EDIT MODE (Does NOT open MainActivity!)
            Intent editIntent = new Intent(context, VoiceDialogActivity.class);
            editIntent.putExtra(VoiceDialogActivity.EXTRA_START_IN_EDIT_MODE, true);
            editIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_MULTIPLE_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent editPendingIntent = PendingIntent.getActivity(
                context, 202, editIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            views.setOnClickPendingIntent(R.id.widgetLargeEditButton, editPendingIntent);

            // 4. Card Root Tap -> Launch VoiceDialogActivity or App
            views.setOnClickPendingIntent(R.id.widgetLargeRootLayout, voicePendingIntent);

            appWidgetManager.updateAppWidget(appWidgetId, views);
        } catch (Throwable t) {
            Log.e("FinanceVoiceWidget", "Error updating 4x2 widget", t);
        }
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
