import { useState } from 'react'
import { Settings as SettingsIcon, Sun, MoonStar, Monitor, Download, Trash2, LogOut } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useSettings } from '@/hooks/use-tracking'
import { useAuthStore } from '@/stores/auth.store'
import { useUIStore } from '@/stores/ui.store'
import { profileService } from '@/services/profile.service'
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
  const [sleepGoal, setSleepGoal] = useState(settings?.sleep_goal_hours ?? 8)
  const [unit, setUnit] = useState<UnitSystem>(settings?.unit_system ?? 'metric')

  const handleSaveGoals = async () => {
    if (!user) return
    await profileService.updateSettings(user.id, {
      water_goal_ml: waterGoal,
      step_goal: stepGoal,
      sleep_goal_hours: sleepGoal,
      unit_system: unit,
    })
    queryClient.invalidateQueries({ queryKey: ['settings'] })
    toast.success('Settings saved!')
  }

  const handleExportData = () => {
    toast.success('Preparing your data export...')
    // In production this would call a Supabase Edge Function to compile a full export.
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
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
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Water Goal (ml)</label>
              <Input type="number" value={waterGoal} onChange={(e) => setWaterGoal(Number(e.target.value))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Step Goal</label>
              <Input type="number" value={stepGoal} onChange={(e) => setStepGoal(Number(e.target.value))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Sleep Goal (hrs)</label>
              <Input type="number" step="0.5" value={sleepGoal} onChange={(e) => setSleepGoal(Number(e.target.value))} />
            </div>
          </div>
          <Button variant="gradient" onClick={handleSaveGoals}>
            Save Changes
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
