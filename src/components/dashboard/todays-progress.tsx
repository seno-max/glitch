import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Footprints, Droplets, Flame, Moon } from 'lucide-react'
import type { DailyProgress } from '@/types/models'

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
          colorClass="bg-gradient-to-r from-orange-400 to-pink-500"
        />
        <ProgressRow
          icon={Droplets}
          label="Water"
          current={progress.waterCurrentMl}
          goal={progress.waterGoalMl}
          formatValue={(v) => `${(v / 1000).toFixed(1)}L`}
          colorClass="gradient-accent"
        />
        <ProgressRow
          icon={Flame}
          label="Calories"
          current={progress.caloriesConsumed}
          goal={2200}
          formatValue={(v) => `${Math.round(v)} kcal`}
          colorClass="gradient-fire"
        />
        <ProgressRow
          icon={Moon}
          label="Sleep"
          current={progress.sleepHours ?? 0}
          goal={progress.sleepGoalHours}
          formatValue={(v) => `${v.toFixed(1)}h`}
          colorClass="gradient-secondary"
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
  colorClass,
}: {
  icon: typeof Footprints
  label: string
  current: number
  goal: number
  formatValue: (v: number) => string
  colorClass: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {formatValue(current)} / {formatValue(goal)}
        </span>
      </div>
      <Progress value={current} max={goal} colorClass={colorClass} />
    </div>
  )
}
