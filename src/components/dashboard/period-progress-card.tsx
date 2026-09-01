import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Dumbbell, Star } from 'lucide-react'
import type { PeriodProgress } from '@/types/models'
import { cn } from '@/lib/utils'

export function PeriodProgressCard({ progress }: { progress: PeriodProgress }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{progress.label}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <Metric icon={Dumbbell} label="Workouts" value={progress.workoutsCompleted.toString()} />
        <Metric icon={Star} label="Workout Minutes" value={progress.totalWorkoutMinutes.toString()} />
        <Metric icon={Star} label="Avg Steps" value={progress.avgSteps.toLocaleString()} />
        <Metric
          icon={progress.weightChangeKg !== null && progress.weightChangeKg <= 0 ? TrendingDown : TrendingUp}
          label="Weight Change"
          value={progress.weightChangeKg !== null ? `${progress.weightChangeKg > 0 ? '+' : ''}${progress.weightChangeKg}kg` : '—'}
          positive={progress.weightChangeKg !== null && progress.weightChangeKg <= 0}
        />
      </CardContent>
    </Card>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
  positive,
}: {
  icon: typeof Dumbbell
  label: string
  value: string
  positive?: boolean
}) {
  return (
    <div className="rounded-xl bg-muted/50 p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
        <Icon className={cn('size-3.5', positive && 'text-success')} />
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-lg font-bold">{value}</p>
    </div>
  )
}
