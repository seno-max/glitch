import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Camera, Loader2, Flame, Star, Trophy, Target, Dumbbell, Clock, TrendingDown, TrendingUp, Award } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Avatar } from '@/components/ui/avatar'
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts'
import { useAuthStore } from '@/stores/auth.store'
import { useDashboard } from '@/hooks/use-dashboard'
import { useAnalyticsSummary, useAchievements } from '@/hooks/use-analytics'
import { profileService } from '@/services/profile.service'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const schema = z.object({
  full_name: z.string().min(2),
  age: z.coerce.number().min(10).max(100),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
  height_cm: z.coerce.number().min(100).max(250),
  current_weight_kg: z.coerce.number().min(30).max(300),
  goal_weight_kg: z.coerce.number().min(30).max(300),
  activity_level: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
  fitness_goal: z.enum(['weight_loss', 'muscle_gain', 'maintenance', 'endurance', 'general_fitness']),
})
type FormValues = z.input<typeof schema>
type FormOutput = z.output<typeof schema>

const FITNESS_GOAL_LABEL: Record<FormOutput['fitness_goal'], string> = {
  weight_loss: 'Weight Loss',
  muscle_gain: 'Muscle Gain',
  maintenance: 'Maintenance',
  endurance: 'Endurance',
  general_fitness: 'General Fitness',
}

export default function ProfilePage() {
  const { user, profile, setProfile } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: profile?.full_name ?? '',
      age: profile?.age ?? undefined,
      gender: profile?.gender ?? 'prefer_not_to_say',
      height_cm: profile?.height_cm ?? undefined,
      current_weight_kg: profile?.current_weight_kg ?? undefined,
      goal_weight_kg: profile?.goal_weight_kg ?? undefined,
      activity_level: profile?.activity_level ?? 'moderate',
      fitness_goal: profile?.fitness_goal ?? 'general_fitness',
    },
  })

  const onSubmit = async (values: FormOutput) => {
    if (!user) return
    try {
      const updated = await profileService.updateProfile(user.id, values)
      setProfile(updated)
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed')
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    try {
      const url = await profileService.uploadAvatar(user.id, file)
      const updated = await profileService.updateProfile(user.id, { avatar_url: url })
      setProfile(updated)
      toast.success('Avatar updated!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const { data: dashboard } = useDashboard()
  const { data: yearAnalytics } = useAnalyticsSummary(365)
  const { data: achievements } = useAchievements()
  const gymStreak = dashboard?.currentStreaks.find((s) => s.category === 'gym')?.current_streak ?? 0
  const unlockedAchievements = (achievements ?? []).filter((a) => a.unlocked).slice(0, 4)

  const weightDiff = dashboard?.weightDifferenceKg
  const weightIsDown = weightDiff !== null && weightDiff !== undefined && weightDiff <= 0
  const weightSpark = (yearAnalytics?.weightTrend ?? []).slice(-14)

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Profile</h1>

      {/* Header banner */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="relative overflow-hidden gradient-hero text-white border-0 shadow-xl">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full gradient-primary opacity-25 blur-2xl" />
          <div className="absolute -left-10 bottom-0 h-48 w-48 rounded-full gradient-secondary opacity-20 blur-2xl" />
          <CardContent className="p-6 flex items-center gap-5 relative z-10">
            <div className="relative shrink-0">
              <Avatar src={profile?.avatar_url} fallback={profile?.full_name ?? 'U'} size={76} />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full gradient-primary text-white shadow-lg ring-2 ring-white/20"
                disabled={uploading}
              >
                {uploading ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold truncate">{profile?.full_name}</p>
              <p className="text-sm text-white/60 truncate">{user?.email}</p>
              {profile?.fitness_goal && (
                <span className="inline-flex items-center gap-1.5 mt-2 rounded-full bg-white/10 border border-white/15 px-2.5 py-1 text-xs font-semibold">
                  <Target className="size-3" /> {FITNESS_GOAL_LABEL[profile.fitness_goal]}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Streak / points stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatTile icon={Flame} value={gymStreak} label="Day Streak" gradient="from-orange-400 to-pink-500" />
        <StatTile icon={Trophy} value={dashboard?.pointsToday ?? 0} label="Points Today" gradient="from-amber-400 to-orange-500" />
        <StatTile icon={Star} value={dashboard?.totalPoints ?? 0} label="Total Points" gradient="from-fuchsia-400 to-purple-600" />
      </div>

      {/* Fitness summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatTile icon={Dumbbell} value={yearAnalytics?.workoutHours ? Math.round((yearAnalytics.workoutHours / 1) * 10) / 10 : 0} valueSuffix="h" label="Total Hours" gradient="from-emerald-400 to-teal-600" />
        <StatTile icon={Clock} value={yearAnalytics?.avgWorkoutMinutes ?? 0} valueSuffix="min" label="Avg Session" gradient="from-sky-400 to-blue-600" />
        <StatTile icon={Award} value={unlockedAchievements.length} label="Achievements" gradient="from-violet-400 to-purple-600" />
      </div>

      {/* Weight progress */}
      {(profile?.current_weight_kg || profile?.goal_weight_kg) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {weightIsDown ? <TrendingDown className="size-4 text-emerald-500" /> : <TrendingUp className="size-4 text-rose-500" />} Weight Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-2xl font-bold">{dashboard?.currentWeightKg?.toFixed(1) ?? '—'} kg</p>
                <p className="text-xs text-muted-foreground">
                  Goal: {dashboard?.goalWeightKg?.toFixed(1) ?? '—'} kg
                  {weightDiff !== null && weightDiff !== undefined && ` · ${Math.abs(weightDiff).toFixed(1)} kg to go`}
                </p>
              </div>
            </div>
            {weightSpark.length > 1 && (
              <div className="h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightSpark}>
                    <YAxis domain={['dataMin - 1', 'dataMax + 1']} hide />
                    <Line type="monotone" dataKey="weight" stroke={weightIsDown ? '#10b981' : '#f43f5e'} strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Achievement showcase */}
      {unlockedAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="size-4 text-amber-500" /> Achievement Showcase
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-4 gap-3">
            {unlockedAchievements.map((a) => (
              <div key={a.id} className="flex flex-col items-center gap-1.5 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-fire text-xl shadow-md">{a.icon}</div>
                <p className="text-[11px] font-medium leading-tight line-clamp-2">{a.name}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground">Full Name</label>
              <Input {...register('full_name')} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Age</label>
              <Input type="number" {...register('age')} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Gender</label>
              <Select {...register('gender')}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Height (cm)</label>
              <Input type="number" {...register('height_cm')} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Current Weight (kg)</label>
              <Input type="number" step="0.1" {...register('current_weight_kg')} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Goal Weight (kg)</label>
              <Input type="number" step="0.1" {...register('goal_weight_kg')} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Activity Level</label>
              <Select {...register('activity_level')}>
                <option value="sedentary">Sedentary</option>
                <option value="light">Light</option>
                <option value="moderate">Moderate</option>
                <option value="active">Active</option>
                <option value="very_active">Very Active</option>
              </Select>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground">Fitness Goal</label>
              <Select {...register('fitness_goal')}>
                <option value="weight_loss">Weight Loss</option>
                <option value="muscle_gain">Muscle Gain</option>
                <option value="maintenance">Maintenance</option>
                <option value="endurance">Endurance</option>
                <option value="general_fitness">General Fitness</option>
              </Select>
            </div>
            <Button type="submit" variant="gradient" className="col-span-2" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Save Profile
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}

function StatTile({
  icon: Icon,
  value,
  valueSuffix,
  label,
  gradient,
}: {
  icon: typeof Flame
  value: number
  valueSuffix?: string
  label: string
  gradient: string
}) {
  return (
    <Card>
      <CardContent className="p-4 flex flex-col items-center text-center gap-1.5">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br shadow-md', gradient)}>
          <Icon className="size-5 text-white" />
        </div>
        <p className="text-lg font-bold">
          {value}
          {valueSuffix}
        </p>
        <p className="text-[11px] text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  )
}
