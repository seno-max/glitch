package com.fittrack.app;

import com.getcapacitor.BridgeActivity;
import com.fittrack.app.widget.GymStreakWidgetPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(GymStreakWidgetPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
