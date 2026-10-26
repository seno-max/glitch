import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'
import { AuthLayout } from '@/components/layout/auth-layout'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { authService } from '@/services/auth.service'

const schema = z
  .object({
    fullName: z.string().min(2, 'Enter your full name'),
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
type FormValues = z.infer<typeof schema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [awaitingConfirmation, setAwaitingConfirmation] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    try {
      const data = await authService.signUp(values.email, values.password, values.fullName)
      // If "Confirm email" is enabled in Supabase, signUp returns no session —
      // the user must click the confirmation link before they can sign in.
      // Show a "check your email" state instead of navigating into the app
      // (which the auth guard would just bounce back to /login).
      if (!data.session) {
        setAwaitingConfirmation(values.email)
        return
      }
      toast.success('Account created! Let\'s set up your profile.')
      navigate('/onboarding', { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sign up failed')
    }
  }

  if (awaitingConfirmation) {
    return (
      <AuthLayout title="Check your email" subtitle="We sent you a confirmation link">
        <div className="flex flex-col items-center text-center gap-3 py-6">
          <CheckCircle2 className="size-12 text-success" />
          <p className="font-semibold">Confirm your email address</p>
          <p className="text-sm text-muted-foreground">
            We've sent a confirmation link to <span className="font-medium">{awaitingConfirmation}</span>. Click it, then sign in to continue.
          </p>
          <Link to="/login" className="text-primary font-semibold hover:underline text-sm mt-2">
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Create your account" subtitle="Start tracking your fitness journey today">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="fullName">Full Name</Label>
          <Input id="fullName" placeholder="John Doe" error={!!errors.fullName} {...register('fullName')} />
          {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName.message}</p>}
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" error={!!errors.email} {...register('email')} />
          {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              error={!!errors.password}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
        </div>
        <div>
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            error={!!errors.confirmPassword}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && <p className="text-xs text-destructive mt-1">{errors.confirmPassword.message}</p>}
        </div>
        <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          Create Account
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-primary font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
