import { useState } from 'react'
import { Settings as SettingsIcon, Sun, MoonStar, Monitor, Download, Trash2, LogOut, ShieldOff, Loader2, ListChecks, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useSettings } from '@/hooks/use-tracking'
import { useAuthStore } from '@/stores/auth.store'
import { useUIStore } from '@/stores/ui.store'
import { profileService } from '@/services/profile.service'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Theme, UnitSystem } from '@/types/database.types'

export default function SettingsPage() {
  const { user, signOut } = useAuthStore()
  const { data: settings } = useSettings()
  const { theme, setTheme } = useUIStore()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [waterGoal, setWaterGoal] = useState(settings?.water_goal_ml ?? 3000)
  const [stepGoal, setStepGoal] = useState(settings?.step_goal ?? 10000)
  const [unit, setUnit] = useState<UnitSystem>(settings?.unit_system ?? 'metric')

  // Configurable rewards — points are entirely opt-in per activity.
  // Setting any of these to 0 disables points for that activity while
  // keeping the activity itself fully trackable.
  const [gymPoints, setGymPoints] = useState(settings?.gym_points ?? 100)
  const [stepsPoints, setStepsPoints] = useState(settings?.steps_points ?? 50)
  const [gymStreakDays, setGymStreakDays] = useState(settings?.gym_streak_days ?? 5)
  const [gymStreakPoints, setGymStreakPoints] = useState(settings?.gym_streak_points ?? 150)

  const handleSaveGoals = async () => {
    if (!user) return
    await profileService.updateSettings(user.id, {
      water_goal_ml: waterGoal,
      step_goal: stepGoal,
      unit_system: unit,
    })
    queryClient.invalidateQueries({ queryKey: ['settings'] })
    toast.success('Settings saved!')
  }

  const handleSaveRewards = async () => {
    if (!user) return
    await profileService.updateSettings(user.id, {
      gym_points: Math.max(0, gymPoints),
      steps_points: Math.max(0, stepsPoints),
      gym_streak_days: Math.max(1, gymStreakDays),
      gym_streak_points: Math.max(0, gymStreakPoints),
    })
    queryClient.invalidateQueries({ queryKey: ['settings'] })
    toast.success('Reward settings saved!')
  }

  const handleExportData = () => {
    toast.success('Preparing your data export...')
    // In production this would call a Supabase Edge Function to compile a full export.
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="size-4" /> My Habits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Manage the custom habits you track every day — add new ones, change how many times a day they need checking, or adjust rewards.
          </p>
          <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
            Manage Habits on Dashboard
          </Button>
        </CardContent>
      </Card>

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
              <p className="text-[11px] text-muted-foreground mt-1">Not everyone wants 10,000 steps — set your own target.</p>
            </div>
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
          <p className="text-sm text-muted-foreground">
            Choose exactly what earns points. Set any value to 0 to track the activity without rewarding it.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Points for Gym Day</Label>
              <Input type="number" min={0} value={gymPoints} onChange={(e) => setGymPoints(Number(e.target.value))} />
            </div>
            <div>
              <Label className="text-xs">Points for Step Goal</Label>
              <Input type="number" min={0} value={stepsPoints} onChange={(e) => setStepsPoints(Number(e.target.value))} />
            </div>
            <div>
              <Label className="text-xs">Gym Streak Length (days)</Label>
              <Input type="number" min={1} value={gymStreakDays} onChange={(e) => setGymStreakDays(Number(e.target.value))} />
            </div>
            <div>
              <Label className="text-xs">Gym Streak Bonus Points</Label>
              <Input type="number" min={0} value={gymStreakPoints} onChange={(e) => setGymStreakPoints(Number(e.target.value))} />
            </div>
          </div>
          <Button variant="gradient" onClick={handleSaveRewards}>
            Save Rewards
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            ['Workout Reminders', 'notif_workout_reminder'],
            ['Water Reminders', 'notif_water_reminder'],
            ['Food Logging Reminders', 'notif_food_reminder'],
            ['Weight Log Reminders', 'notif_weight_reminder'],
            ['Progress Photo Reminders', 'notif_photo_reminder'],
            ['Challenge Reminders', 'notif_challenge_reminder'],
          ].map(([label]) => (
            <label key={label} className="flex items-center justify-between">
              <span className="text-sm">{label}</span>
              <input type="checkbox" defaultChecked className="accent-primary size-4" />
            </label>
          ))}
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
          <Button variant="outline" className="w-full" onClick={handleExportData}>
            <Download className="size-4" /> Export My Data
          </Button>
          <Button variant="outline" className="w-full text-destructive border-destructive/30 hover:bg-destructive/10">
            <Trash2 className="size-4" /> Delete Account
          </Button>
        </CardContent>
      </Card>

      <Button variant="outline" className="w-full" onClick={handleSignOut}>
        <LogOut className="size-4" /> Sign Out
      </Button>
    </div>
  )
}
