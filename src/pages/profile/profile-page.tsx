import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Camera, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Avatar } from '@/components/ui/avatar'
import { CircularProgress } from '@/components/ui/circular-progress'
import { useAuthStore } from '@/stores/auth.store'
import { profileService } from '@/services/profile.service'
import { getLevelForXp } from '@/types/models'
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

  const xp = profile?.xp ?? 0
  const { level, progressPct } = getLevelForXp(xp)

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Profile</h1>

      <Card>
        <CardContent className="p-6 flex items-center gap-6">
          <div className="relative">
            <Avatar src={profile?.avatar_url} fallback={profile?.full_name ?? 'U'} size={80} />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full gradient-primary text-white shadow-lg"
              disabled={uploading}
            >
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <div className="flex-1">
            <p className="text-lg font-bold">{profile?.full_name}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <CircularProgress value={progressPct} max={100} size={64} strokeWidth={6}>
            <span className="text-sm font-bold">L{level}</span>
          </CircularProgress>
        </CardContent>
      </Card>

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
