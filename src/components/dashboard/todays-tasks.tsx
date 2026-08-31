import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Circle, ChevronRight, Dumbbell, Footprints, Droplets, UtensilsCrossed, Scale, Moon, type LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import type { TaskItem } from '@/types/models'

const TASK_ICONS: Record<string, LucideIcon> = {
  Dumbbell,
  Footprints,
  Droplets,
  UtensilsCrossed,
  Scale,
  Moon,
}

export function TodaysTasks({ tasks }: { tasks: TaskItem[] }) {
  const navigate = useNavigate()
  const completed = tasks.filter((t) => t.completed).length

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Today's Tasks</CardTitle>
        <span className="text-sm font-semibold text-primary">
          {completed}/{tasks.length}
        </span>
      </CardHeader>
      <CardContent className="space-y-1">
        {tasks.map((task, i) => {
          const Icon = TASK_ICONS[task.icon] ?? Circle
          return (
            <motion.button
              key={task.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => task.href && navigate(task.href)}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-muted transition-colors text-left"
            >
              {task.completed ? (
                <CheckCircle2 className="size-5 text-success shrink-0" />
              ) : (
                <Circle className="size-5 text-muted-foreground shrink-0" />
              )}
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted shrink-0">
                <Icon className="size-4 text-muted-foreground" />
              </div>
              <span className={cn('flex-1 text-sm font-medium', task.completed && 'line-through text-muted-foreground')}>
                {task.label}
              </span>
              <span className="text-xs font-semibold text-primary">+{task.points}</span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </motion.button>
          )
        })}
      </CardContent>
    </Card>
  )
}
