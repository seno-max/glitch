import { useState, useEffect, useRef } from 'react'
import { Settings as SettingsIcon, Sun, MoonStar, Monitor, Download, Upload, FileSpreadsheet, Trash2, LogOut, ShieldOff, Loader2, Zap, CalendarOff, Bell } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { HabitManager } from '@/components/settings/habit-manager'
import { StreakRewardManager } from '@/components/settings/streak-reward-manager'
import { useSettings } from '@/hooks/use-tracking'
import { useAuthStore } from '@/stores/auth.store'
import { useUIStore } from '@/stores/ui.store'
import { profileService } from '@/services/profile.service'
import { notificationService, type ReminderTimes } from '@/services/notification.service'
import { exportAsExcel, exportAsJson, importDataFile } from '@/services/data-port.service'
import { useSingleFlight } from '@/hooks/use-single-flight'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Theme, UnitSystem } from '@/types/database.types'

const WEEKDAYS = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
]

const NOTIFICATION_OPTIONS: { label: string; column: string; reminderKey: keyof ReminderTimes }[] = [
  { label: 'Workout Reminders', column: 'notif_workout_reminder', reminderKey: 'workout' },
  { label: 'Water Reminders', column: 'notif_water_reminder', reminderKey: 'water' },
  { label: 'Food Logging Reminders', column: 'notif_food_reminder', reminderKey: 'food' },
  { label: 'Weight Log Reminders', column: 'notif_weight_reminder', reminderKey: 'weight' },
  { label: 'Progress Photo Reminders', column: 'notif_photo_reminder', reminderKey: 'photo' },
  { label: 'Challenge Reminders', column: 'notif_challenge_reminder', reminderKey: 'challenge' },
]

export default function SettingsPage() {
  const { user, signOut } = useAuthStore()
  const { data: settings } = useSettings()
  const { theme, setTheme } = useUIStore()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [waterGoal, setWaterGoal] = useState(settings?.water_goal_ml ?? 3000)
  const [stepGoal, setStepGoal] = useState(settings?.step_goal ?? 10000)
  const [unit, setUnit] = useState<UnitSystem>(settings?.unit_system ?? 'metric')
  const [restDays, setRestDays] = useState<number[]>(settings?.rest_days ?? [])

  // Notification preferences — these persist to the settings table and
  // drive real daily reminder scheduling on Android (see
  // notificationService.syncScheduledReminders).
  const [notifToggles, setNotifToggles] = useState<Record<string, boolean>>({
    notif_workout_reminder: settings?.notif_workout_reminder ?? true,
    notif_water_reminder: settings?.notif_water_reminder ?? true,
    notif_food_reminder: settings?.notif_food_reminder ?? true,
    notif_weight_reminder: settings?.notif_weight_reminder ?? true,
    notif_photo_reminder: settings?.notif_photo_reminder ?? false,
    notif_challenge_reminder: settings?.notif_challenge_reminder ?? true,
  })
  const [reminderTimes, setReminderTimes] = useState<ReminderTimes>(() => {
    const times = (settings?.reminder_times ?? {}) as ReminderTimes
    return {
      workout: times.workout ?? '18:00',
      water: times.water ?? '15:00',
      food: times.food ?? '21:00',
      weight: times.weight ?? '08:00',
      photo: times.photo ?? '20:00',
      challenge: times.challenge ?? '19:00',
    }
  })
  const [savingNotifs, setSavingNotifs] = useState(false)
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [exporting, setExporting] = useState<'excel' | 'json' | null>(null)
  const importFileRef = useRef<HTMLInputElement>(null)

  const [handleExport, exportingInFlight] = useSingleFlight(async (format: 'excel' | 'json') => {
    if (!user) return
    setExporting(format)
    toast.success(`Preparing your ${format === 'excel' ? 'Excel' : 'JSON'} export...`)
    try {
      const savedTo = format === 'excel' ? await exportAsExcel() : await exportAsJson()
      toast.success(`Export ready${savedTo.startsWith('/') || savedTo.startsWith('file:') ? ` — saved to ${savedTo}` : ' — download started'}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to export data')
    } finally {
      setExporting(null)
    }
  })

  const [handleImport, importingInFlight] = useSingleFlight(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    try {
      const { imported, errors } = await importDataFile(user.id, file)
      queryClient.invalidateQueries()
      if (errors.length > 0) {
        toast.error(`Imported ${imported} rows, but ${errors.length} table(s) had issues — check your file and try again`)
      } else {
        toast.success(`Imported ${imported} rows successfully`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to import that file')
    } finally {
      e.target.value = ''
    }
  })

  // Sync local state once settings actually load (they may arrive after mount).
  useEffect(() => {
    if (!settings) return
    setWaterGoal(settings.water_goal_ml ?? 3000)
    setStepGoal(settings.step_goal ?? 10000)
    setUnit(settings.unit_system ?? 'metric')
    setRestDays(settings.rest_days ?? [])
    setNotifToggles({
      notif_workout_reminder: settings.notif_workout_reminder,
      notif_water_reminder: settings.notif_water_reminder,
      notif_food_reminder: settings.notif_food_reminder,
      notif_weight_reminder: settings.notif_weight_reminder,
      notif_photo_reminder: settings.notif_photo_reminder,
      notif_challenge_reminder: settings.notif_challenge_reminder,
    })
    const times = (settings.reminder_times ?? {}) as ReminderTimes
    setReminderTimes((prev) => ({
      workout: times.workout ?? prev.workout,
      water: times.water ?? prev.water,
      food: times.food ?? prev.food,
      weight: times.weight ?? prev.weight,
      photo: times.photo ?? prev.photo,
      challenge: times.challenge ?? prev.challenge,
    }))
  }, [settings])

  // Configurable rewards — points are entirely opt-in per activity.
  // Setting either of these to 0 disables points for that activity while
  // keeping the activity itself fully trackable. Streak-length milestones
  // and their bonus points are now fully user-defined (see Streak Rewards
  // below) instead of a single fixed "gym streak" template.
  const [gymPoints, setGymPoints] = useState(settings?.gym_points ?? 100)
  const [stepsPoints, setStepsPoints] = useState(settings?.steps_points ?? 50)

  const handleSaveGoals = async () => {
    if (!user) return
    await profileService.updateSettings(user.id, {
      water_goal_ml: waterGoal,
      step_goal: stepGoal,
      unit_system: unit,
      rest_days: restDays,
    })
    queryClient.invalidateQueries({ queryKey: ['settings'] })
    toast.success('Settings saved!')
  }

  const toggleRestDay = (day: number) => {
    setRestDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()))
  }

  const handleSaveRewards = async () => {
    if (!user) return
    await profileService.updateSettings(user.id, {
      gym_points: Math.max(0, gymPoints),
      steps_points: Math.max(0, stepsPoints),
    })
    queryClient.invalidateQueries({ queryKey: ['settings'] })
    toast.success('Reward settings saved!')
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const [signingOutOthers, setSigningOutOthers] = useState(false)
  const handleSignOutOtherDevices = async () => {
    setSigningOutOthers(true)
    try {
      const { error } = await supabase.auth.signOut({ scope: 'others' })
      if (error) throw error
      toast.success('Signed out of all other devices')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to sign out other devices')
    } finally {
      setSigningOutOthers(false)
    }
  }

  const handleToggleNotif = (column: string) => {
    setNotifToggles((prev) => ({ ...prev, [column]: !prev[column] }))
  }

  const handleSaveNotifications = async () => {
    if (!user) return
    setSavingNotifs(true)
    try {
      await profileService.updateSettings(user.id, {
        ...notifToggles,
        reminder_times: reminderTimes,
      } as never)
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      // Re-schedule the Android daily reminders so changes take effect now.
      await notificationService.syncScheduledReminders({ ...notifToggles, reminder_times: reminderTimes })
      toast.success('Notification settings saved!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save notification settings')
    } finally {
      setSavingNotifs(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user || deletingAccount) return
    setDeletingAccount(true)
    try {
      // Remove the user's storage files first (the auth.users row cascade
      // below doesn't reach Storage objects).
      for (const bucket of ['progress-photos', 'avatars']) {
        const { data: files } = await supabase.storage.from(bucket).list(user.id)
        if (files && files.length > 0) {
          await supabase.storage.from(bucket).remove(files.map((f) => `${user.id}/${f.name}`))
        }
      }
      // Deletes the auth user row — every user-owned table references
      // auth.users(id) ON DELETE CASCADE, so all data goes with it
      // (see supabase/migrations/0013 — delete_my_account()).
      const { error: rpcError } = await supabase.rpc('delete_my_account')
      if (rpcError) throw rpcError
      await signOut()
      navigate('/login')
      toast.success('Account deleted')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete account')
      setDeletingAccount(false)
    }
  }

  const themeOptions: { value: Theme; icon: typeof Sun; label: string }[] = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: MoonStar, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ]

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <SettingsIcon className="size-6 text-primary" /> Settings
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all',
                  theme === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                )}
              >
                <opt.icon className="size-5" />
                <span className="text-xs font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <HabitManager />

      <StreakRewardManager />

      <Card>
        <CardHeader>
          <CardTitle>Goals & Units</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground">Unit System</label>
            <Select value={unit} onChange={(e) => setUnit(e.target.value as UnitSystem)}>
              <option value="metric">Metric (kg, cm, km)</option>
              <option value="imperial">Imperial (lbs, in, mi)</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Water Goal (ml)</label>
              <Input type="number" value={waterGoal} onChange={(e) => setWaterGoal(Number(e.target.value))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Step Goal</label>
              <Input type="number" value={stepGoal} onChange={(e) => setStepGoal(Number(e.target.value))} />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-2">
              <CalendarOff className="size-3.5" /> Rest Days
            </label>
            <div className="grid grid-cols-7 gap-1.5">
              {WEEKDAYS.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleRestDay(day.value)}
                  className={cn(
                    'flex flex-col items-center justify-center rounded-xl border-2 py-2.5 text-xs font-semibold transition-all',
                    restDays.includes(day.value) ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-primary/30'
                  )}
                >
                  {day.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Skipping the gym on a rest day won't break your streak — it just gets bridged over, as long as you're back at it the day after.
            </p>
          </div>
          <Button variant="gradient" onClick={handleSaveGoals}>
            Save Changes
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="size-4 text-amber-500" /> Rewards & Points
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Points for Gym Day</Label>
              <Input type="number" min={0} value={gymPoints} onChange={(e) => setGymPoints(Number(e.target.value))} />
            </div>
            <div>
              <Label className="text-xs">Points for Step Goal</Label>
              <Input type="number" min={0} value={stepsPoints} onChange={(e) => setStepsPoints(Number(e.target.value))} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Want bonus points for hitting a streak? Add a Streak Reward above — you pick the name, day count, and points.
          </p>
          <Button variant="gradient" onClick={handleSaveRewards}>
            Save Rewards
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="size-4 text-primary" /> Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Daily reminders are delivered as local notifications on your phone at the time you pick for each one.
          </p>
          {NOTIFICATION_OPTIONS.map((opt) => (
            <div key={opt.column} className="flex items-center justify-between gap-3">
              <span className="text-sm">{opt.label}</span>
              <div className="flex items-center gap-3">
                <input
                  type="time"
                  value={reminderTimes[opt.reminderKey] ?? ''}
                  onChange={(e) => setReminderTimes((prev) => ({ ...prev, [opt.reminderKey]: e.target.value }))}
                  className="rounded-lg border border-border bg-card px-2 py-1 text-xs"
                  disabled={!notifToggles[opt.column]}
                />
                <input
                  type="checkbox"
                  checked={notifToggles[opt.column] ?? false}
                  onChange={() => handleToggleNotif(opt.column)}
                  className="accent-primary size-4"
                />
              </div>
            </div>
          ))}
          <Button variant="gradient" onClick={handleSaveNotifications} disabled={savingNotifs}>
            {savingNotifs ? <Loader2 className="size-4 animate-spin" /> : null}
            Save Notification Settings
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sessions & Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            You can be signed in on multiple phones or devices at once. Signing out only signs you out of this device.
          </p>
          <Button variant="outline" className="w-full" onClick={handleSignOutOtherDevices} disabled={signingOutOthers}>
            {signingOutOthers ? <Loader2 className="size-4 animate-spin" /> : <ShieldOff className="size-4" />}
            Sign Out of All Other Devices
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Export a full backup of everything against your profile, or restore it from a previously exported file.
          </p>
          <Button variant="gradient" className="w-full" onClick={() => handleExport('excel')} disabled={exportingInFlight}>
            {exporting === 'excel' ? <Loader2 className="size-4 animate-spin" /> : <FileSpreadsheet className="size-4" />} Export as Excel (.xlsx)
          </Button>
          <Button variant="outline" className="w-full" onClick={() => handleExport('json')} disabled={exportingInFlight}>
            {exporting === 'json' ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} Export as JSON
          </Button>
          <Button variant="outline" className="w-full" onClick={() => importFileRef.current?.click()} disabled={importingInFlight}>
            {importingInFlight ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} Import from file (.xlsx or .json)
          </Button>
          <input ref={importFileRef} type="file" accept=".xlsx,.xls,.json" className="hidden" onChange={handleImport} />
          <Button variant="outline" className="w-full text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setDeleteAccountOpen(true)}>
            <Trash2 className="size-4" /> Delete Account
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteAccountOpen}
        onOpenChange={(open) => !deletingAccount && setDeleteAccountOpen(open)}
        title="Delete your account?"
        description="This permanently deletes your account and ALL your data — workouts, meals, logs, photos, achievements, everything. This can't be undone."
        confirmLabel={deletingAccount ? 'Deleting...' : 'Delete Forever'}
        onConfirm={handleDeleteAccount}
      />

      <Button variant="outline" className="w-full" onClick={handleSignOut}>
        <LogOut className="size-4" /> Sign Out
      </Button>
    </div>
  )
}
