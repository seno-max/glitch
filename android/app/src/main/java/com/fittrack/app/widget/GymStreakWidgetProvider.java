package com.fittrack.app.widget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;
import com.fittrack.app.MainActivity;
import com.fittrack.app.R;

/**
 * 2x1 home-screen widget showing the current gym streak alongside a
 * "gym cat" mascot that changes pose and accent color depending on streak
 * length -- mirroring Duolingo's rotating-owl-reaction widget instead of a
 * single static uniform-color image. Tapping anywhere on the widget
 * launches the app (MainActivity).
 *
 * Data flow: the web app calls the GymStreakWidgetPlugin ("updateStreak")
 * whenever the gym streak changes (after logging/deleting a workout) or on
 * every dashboard load, which writes the value into this provider's own
 * SharedPreferences file and triggers pushUpdate() for an immediate
 * refresh. Android's periodic updatePeriodMillis (see
 * gym_streak_widget_info.xml) is just a background-refresh safety net.
 */
public class GymStreakWidgetProvider extends AppWidgetProvider {

    public static final String PREFS_NAME = "com.fittrack.app.widget.GymStreakWidgetProvider";
    public static final String KEY_STREAK = "gym_streak";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int widgetId : appWidgetIds) {
            updateWidget(context, appWidgetManager, widgetId);
        }
    }

    /** Called by GymStreakWidgetPlugin right after the streak value changes, so every placed widget instance refreshes immediately instead of waiting for the next periodic tick. */
    public static void pushUpdate(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        ComponentName provider = new ComponentName(context, GymStreakWidgetProvider.class);
        int[] ids = manager.getAppWidgetIds(provider);
        for (int id : ids) {
            updateWidget(context, manager, id);
        }
    }

    /**
     * Picks the mascot pose + background glow color for a given streak
     * length. Tiers escalate in energy the longer the streak runs, ending
     * on the celebratory cycling pose for a full week+.
     */
    private static int poseDrawableFor(int streak) {
        if (streak <= 0) return R.drawable.cat_pose_ready;
        if (streak <= 2) return R.drawable.cat_pose_dumbbell;
        if (streak <= 4) return R.drawable.cat_pose_running;
        if (streak <= 6) return R.drawable.cat_pose_squat;
        return R.drawable.cat_pose_cycling;
    }

    private static int backgroundDrawableFor(int streak) {
        if (streak <= 0) return R.drawable.widget_bg_ready;
        if (streak <= 2) return R.drawable.widget_bg_dumbbell;
        if (streak <= 4) return R.drawable.widget_bg_running;
        if (streak <= 6) return R.drawable.widget_bg_squat;
        return R.drawable.widget_bg_cycling;
    }

    private static void updateWidget(Context context, AppWidgetManager manager, int widgetId) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        int streak = prefs.getInt(KEY_STREAK, 0);

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_gym_streak);
        views.setTextViewText(R.id.widget_streak_value, String.valueOf(streak));
        views.setTextViewText(R.id.widget_streak_label, context.getString(R.string.widget_gym_streak_label));
        views.setImageViewResource(R.id.widget_cat_image, poseDrawableFor(streak));
        views.setInt(R.id.widget_root, "setBackgroundResource", backgroundDrawableFor(streak));

        Intent launchIntent = new Intent(context, MainActivity.class);
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            context,
            0,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_root, pendingIntent);

        manager.updateAppWidget(widgetId, views);
    }
}
