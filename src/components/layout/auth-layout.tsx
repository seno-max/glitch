import { motion } from 'framer-motion'
import { Dumbbell } from 'lucide-react'

export function AuthLayout({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 relative gradient-hero items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full gradient-primary blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full gradient-secondary blur-3xl" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-md text-white"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-glow mb-8">
            <Dumbbell className="size-7 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4 leading-tight">Build habits that last. Track everything that matters.</h1>
          <p className="text-white/60 text-lg">
            Strength, cardio, nutrition, sleep &amp; more — all in one beautifully designed fitness companion.
          </p>
          <div className="flex gap-6 mt-10">
            {[
              ['10K+', 'Workouts Logged'],
              ['98%', 'Consistency Rate'],
              ['4.9★', 'User Rating'],
            ].map(([stat, label]) => (
              <div key={label}>
                <p className="text-2xl font-bold text-gradient-primary">{stat}</p>
                <p className="text-sm text-white/50">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background safe-top">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          <div className="flex lg:hidden items-center gap-2.5 mb-8 justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-glow">
              <Dumbbell className="size-5 text-white" />
            </div>
            <span className="font-bold text-xl">FitTrack</span>
          </div>
          <h2 className="text-2xl font-bold mb-1">{title}</h2>
          <p className="text-muted-foreground text-sm mb-8">{subtitle}</p>
          {children}
        </motion.div>
      </div>
    </div>
  )
}
