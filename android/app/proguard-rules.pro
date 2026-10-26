# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Keep the app's own native classes: the Capacitor plugin bridge
# (GymStreakWidgetPlugin is registered by name via @CapacitorPlugin) and the
# widget provider referenced from the manifest. Capacitor's consumer rules
# cover the library classes; these cover ours.
-keep class com.fittrack.app.** { *; }
-keepclassmembers class com.getcapacitor.** { public *; }

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile
