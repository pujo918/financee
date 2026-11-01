package com.pujo.financee;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.widget.RemoteViews;

public class FinanceWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        SharedPreferences prefs = context.getSharedPreferences("FinanceWidgetPrefs", Context.MODE_PRIVATE);
        String balance = prefs.getString("monthlyBalance", "Rp 0");
        String income = prefs.getString("monthlyIncome", "+Rp 0");
        String expense = prefs.getString("monthlyExpense", "-Rp 0");

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.finance_widget_layout);
        views.setTextViewText(R.id.widgetBalanceText, balance);
        views.setTextViewText(R.id.widgetIncomeText, income);
        views.setTextViewText(R.id.widgetExpenseText, expense);

        // Click anywhere on widget card -> Open App Dashboard
        Intent openAppIntent = new Intent(context, MainActivity.class);
        openAppIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent openAppPendingIntent = PendingIntent.getActivity(
            context, 0, openAppIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widgetRootLayout, openAppPendingIntent);

        // Click on 1-Tap Mic Button -> Launch App and directly start voice input
        Intent voiceIntent = new Intent(context, MainActivity.class);
        voiceIntent.setAction("ACTION_VOICE_INPUT");
        voiceIntent.setData(Uri.parse("financee://voice"));
        voiceIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent voicePendingIntent = PendingIntent.getActivity(
            context, 1, voiceIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widgetMicButton, voicePendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    public static void updateAllWidgets(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        ComponentName componentName = new ComponentName(context, FinanceWidgetProvider.class);
        int[] ids = manager.getAppWidgetIds(componentName);
        if (ids != null && ids.length > 0) {
            for (int id : ids) {
                updateAppWidget(context, manager, id);
            }
        }
    }
}
