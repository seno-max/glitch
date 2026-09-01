import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Footprints, Droplets } from 'lucide-react'
import type { DailyProgress } from '@/types/models'
import { cn } from '@/lib/utils'

export function TodaysProgress({ progress }: { progress: DailyProgress }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <ProgressRow
          icon={Footprints}
          label="Steps"
          current={progress.stepsCurrent}
          goal={progress.stepsGoal}
          formatValue={(v) => v.toLocaleString()}
          iconGradient="from-orange-400 to-pink-500"
          barColorClass="bg-gradient-to-r from-orange-400 to-pink-500"
        />
        <ProgressRow
          icon={Droplets}
          label="Water"
          current={progress.waterCurrentMl}
          goal={progress.waterGoalMl}
          formatValue={(v) => `${(v / 1000).toFixed(1)}L`}
          iconGradient="from-sky-400 to-blue-600"
          barColorClass="gradient-accent"
        />
      </CardContent>
    </Card>
  )
}

function ProgressRow({
  icon: Icon,
  label,
  current,
  goal,
  formatValue,
  iconGradient,
  barColorClass,
}: {
  icon: typeof Footprints
  label: string
  current: number
  goal: number
  formatValue: (v: number) => string
  iconGradient: string
  barColorClass: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <div className={cn('flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br', iconGradient)}>
            <Icon className="size-3.5 text-white" strokeWidth={2.25} />
          </div>
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {formatValue(current)} / {formatValue(goal)}
        </span>
      </div>
      <Progress value={current} max={goal} colorClass={barColorClass} />
    </div>
  )
}
