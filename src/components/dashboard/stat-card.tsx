import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

export function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  gradientClass = 'gradient-primary',
  delay = 0,
  onClick,
}: {
  icon: LucideIcon
  label: string
  value: string
  subValue?: string
  gradientClass?: string
  delay?: number
  onClick?: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
    >
      <Card
        className={cn('card-hover relative overflow-hidden p-5', onClick && 'cursor-pointer')}
        onClick={onClick}
      >
        <div className={cn('absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10', gradientClass)} />
        <div className="flex items-start justify-between relative z-10">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {subValue && <p className="text-xs text-muted-foreground mt-1">{subValue}</p>}
          </div>
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl shrink-0', gradientClass)}>
            <Icon className="size-5 text-white" />
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
