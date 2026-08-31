import { motion } from 'framer-motion'
import { Play, UtensilsCrossed, Scale, Droplets, Footprints } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

const actions = [
  { icon: Play, label: 'Start Workout', to: '/workout', gradient: 'gradient-primary' },
  { icon: UtensilsCrossed, label: 'Log Food', to: '/nutrition', gradient: 'gradient-fire' },
  { icon: Scale, label: 'Add Weight', to: '/tracking/weight', gradient: 'gradient-secondary' },
  { icon: Droplets, label: 'Log Water', to: '/tracking/water', gradient: 'gradient-accent' },
  { icon: Footprints, label: 'Log Steps', to: '/tracking/steps', gradient: 'bg-gradient-to-br from-orange-400 to-pink-500' },
]

export function QuickActions() {
  const navigate = useNavigate()
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
      {actions.map((action, i) => (
        <motion.button
          key={action.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => navigate(action.to)}
          className="flex flex-col items-center gap-2 shrink-0 group"
        >
          <div
            className={cn(
              'flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg transition-transform group-hover:scale-105 group-active:scale-95',
              action.gradient
            )}
          >
            <action.icon className="size-6 text-white" />
          </div>
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">{action.label}</span>
        </motion.button>
      ))}
    </div>
  )
}
