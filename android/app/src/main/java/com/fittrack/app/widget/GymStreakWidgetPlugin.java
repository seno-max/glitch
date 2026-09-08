package com.fittrack.app.widget;

import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Bridges the web app to the native Gym Streak home-screen widget. The web
 * app calls updateStreak() every time it loads the dashboard or after a
 * workout is saved/deleted, so the widget always reflects the latest gym
 * streak without waiting for Android's periodic update tick.
 */
@CapacitorPlugin(name = "GymStreakWidget")
public class GymStreakWidgetPlugin extends Plugin {

    @PluginMethod
    public void updateStreak(PluginCall call) {
        int streak = call.getInt("streak", 0);

        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences(GymStreakWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putInt(GymStreakWidgetProvider.KEY_STREAK, streak).apply();

        GymStreakWidgetProvider.pushUpdate(context);

        JSObject ret = new JSObject();
        ret.put("streak", streak);
        call.resolve(ret);
    }
}
