import { motion } from 'framer-motion'
import { Dumbbell } from 'lucide-react'

export function SplashScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center gradient-hero">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex flex-col items-center gap-4"
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl gradient-primary shadow-glow">
          <Dumbbell className="size-10 text-white" />
        </div>
        <motion.div
          className="h-1 w-32 overflow-hidden rounded-full bg-white/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div
            className="h-full w-1/2 gradient-primary rounded-full"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
        <p className="text-white/60 text-sm font-medium tracking-wide">Loading your fitness journey...</p>
      </motion.div>
    </div>
  )
}
