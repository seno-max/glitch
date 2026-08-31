import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Dumbbell, Loader2, ArrowRight, ArrowLeft } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'
import { profileService } from '@/services/profile.service'

const schema = z.object({
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

const steps = [
  { key: 'basics', title: 'Tell us about yourself', fields: ['age', 'gender'] },
  { key: 'body', title: 'Your body stats', fields: ['height_cm', 'current_weight_kg', 'goal_weight_kg'] },
  { key: 'goals', title: 'Your fitness goals', fields: ['activity_level', 'fitness_goal'] },
]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { user, setProfile } = useAuthStore()
  const [step, setStep] = useState(0)
  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { activity_level: 'moderate', fitness_goal: 'general_fitness', gender: 'prefer_not_to_say' },
  })

  const next = async () => {
    const valid = await trigger(steps[step].fields as (keyof FormValues)[])
    if (valid) setStep((s) => Math.min(s + 1, steps.length - 1))
  }
  const back = () => setStep((s) => Math.max(s - 1, 0))

  const onSubmit = async (values: FormOutput) => {
    if (!user) return
    try {
      const updated = await profileService.updateProfile(user.id, { ...values, onboarded: true })
      setProfile(updated)
      toast.success('Profile complete! Welcome aboard 🎉')
      navigate('/', { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save profile')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg rounded-3xl glass-card p-8 shadow-2xl"
      >
        <div className="flex items-center gap-2.5 mb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary shadow-glow">
            <Dumbbell className="size-5 text-white" />
          </div>
          <span className="font-bold text-lg">FitTrack Setup</span>
        </div>

        <div className="flex gap-1.5 mb-8">
          {steps.map((_, i) => (
            <div key={i} className={cn('h-1.5 flex-1 rounded-full transition-colors', i <= step ? 'gradient-primary' : 'bg-muted')} />
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-xl font-bold mb-6">{steps[step].title}</h2>

              {step === 0 && (
                <div className="space-y-4">
                  <div>
                    <Label>Age</Label>
                    <Input type="number" placeholder="25" error={!!errors.age} {...register('age')} />
                    {errors.age && <p className="text-xs text-destructive mt-1">{errors.age.message}</p>}
                  </div>
                  <div>
                    <Label>Gender</Label>
                    <Select {...register('gender')}>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </Select>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <Label>Height (cm)</Label>
                    <Input type="number" placeholder="175" error={!!errors.height_cm} {...register('height_cm')} />
                    {errors.height_cm && <p className="text-xs text-destructive mt-1">{errors.height_cm.message}</p>}
                  </div>
                  <div>
                    <Label>Current Weight (kg)</Label>
                    <Input type="number" step="0.1" placeholder="80" error={!!errors.current_weight_kg} {...register('current_weight_kg')} />
                    {errors.current_weight_kg && <p className="text-xs text-destructive mt-1">{errors.current_weight_kg.message}</p>}
                  </div>
                  <div>
                    <Label>Goal Weight (kg)</Label>
                    <Input type="number" step="0.1" placeholder="72" error={!!errors.goal_weight_kg} {...register('goal_weight_kg')} />
                    {errors.goal_weight_kg && <p className="text-xs text-destructive mt-1">{errors.goal_weight_kg.message}</p>}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label>Activity Level</Label>
                    <Select {...register('activity_level')}>
                      <option value="sedentary">Sedentary (little to no exercise)</option>
                      <option value="light">Light (1-3 days/week)</option>
                      <option value="moderate">Moderate (3-5 days/week)</option>
                      <option value="active">Active (6-7 days/week)</option>
                      <option value="very_active">Very Active (physical job + training)</option>
                    </Select>
                  </div>
                  <div>
                    <Label>Fitness Goal</Label>
                    <Select {...register('fitness_goal')}>
                      <option value="weight_loss">Weight Loss</option>
                      <option value="muscle_gain">Muscle Gain</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="endurance">Endurance</option>
                      <option value="general_fitness">General Fitness</option>
                    </Select>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <Button type="button" variant="outline" onClick={back} className="flex-1">
                <ArrowLeft className="size-4" /> Back
              </Button>
            )}
            {step < steps.length - 1 ? (
              <Button type="button" variant="gradient" onClick={next} className="flex-1">
                Next <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button type="submit" variant="gradient" className="flex-1" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                Finish Setup
              </Button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  )
}
