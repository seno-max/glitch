import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Dumbbell, Clock, Footprints } from 'lucide-react'
import type { PeriodProgress } from '@/types/models'
import { cn } from '@/lib/utils'

export function PeriodProgressCard({ progress }: { progress: PeriodProgress }) {
  const weightIsDown = progress.weightChangeKg !== null && progress.weightChangeKg <= 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>{progress.label}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        <Metric icon={Dumbbell} label="Workouts" value={progress.workoutsCompleted.toString()} gradient="from-emerald-400 to-teal-600" />
        <Metric icon={Clock} label="Workout Minutes" value={progress.totalWorkoutMinutes.toString()} gradient="from-purple-400 to-indigo-600" />
        <Metric icon={Footprints} label="Avg Steps" value={progress.avgSteps.toLocaleString()} gradient="from-orange-400 to-pink-500" />
        <Metric
          icon={weightIsDown ? TrendingDown : TrendingUp}
          label="Weight Change"
          value={progress.weightChangeKg !== null ? `${progress.weightChangeKg > 0 ? '+' : ''}${progress.weightChangeKg}kg` : '—'}
          gradient={weightIsDown ? 'from-teal-400 to-emerald-600' : 'from-rose-400 to-red-500'}
        />
      </CardContent>
    </Card>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
  gradient,
}: {
  icon: typeof Dumbbell
  label: string
  value: string
  gradient: string
}) {
  return (
    <div className="rounded-xl bg-muted/40 p-3">
      <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br mb-2', gradient)}>
        <Icon className="size-4 text-white" strokeWidth={2.25} />
      </div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  )
}
