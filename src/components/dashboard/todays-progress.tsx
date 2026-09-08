import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Footprints, Droplets, Dumbbell, Check } from 'lucide-react'
import { Ring } from '@/components/ui/ring'
import type { DailyProgress } from '@/types/models'

/**
 * "Today" summary rendered as three activity rings (Apple Fitness / Google
 * Fit style) instead of flat progress bars — a single glance tells you
 * exactly how the day is going, and each ring fills with a satisfying
 * animation the moment you log something.
 */
export function TodaysProgress({ progress }: { progress: DailyProgress }) {
  const stepsPct = progress.stepsGoal > 0 ? Math.min(100, (progress.stepsCurrent / progress.stepsGoal) * 100) : 0
  const waterPct = progress.waterGoalMl > 0 ? Math.min(100, (progress.waterCurrentMl / progress.waterGoalMl) * 100) : 0
  const workoutPct = progress.workoutDone ? 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          <RingStat
            icon={Footprints}
            label="Steps"
            pct={stepsPct}
            valueLabel={progress.stepsCurrent.toLocaleString()}
            goalLabel={`/ ${progress.stepsGoal.toLocaleString()}`}
            colorFrom="#fb923c"
            colorTo="#ec4899"
          />
          <RingStat
            icon={Droplets}
            label="Water"
            pct={waterPct}
            valueLabel={`${(progress.waterCurrentMl / 1000).toFixed(1)}L`}
            goalLabel={`/ ${(progress.waterGoalMl / 1000).toFixed(1)}L`}
            colorFrom="#38bdf8"
            colorTo="#0ea5e9"
          />
          <RingStat
            icon={Dumbbell}
            label="Workout"
            pct={workoutPct}
            valueLabel={progress.workoutDone ? 'Done' : 'Not yet'}
            goalLabel=""
            colorFrom="#34d399"
            colorTo="#059669"
            showCheck={progress.workoutDone}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function RingStat({
  icon: Icon,
  label,
  pct,
  valueLabel,
  goalLabel,
  colorFrom,
  colorTo,
  showCheck,
}: {
  icon: typeof Footprints
  label: string
  pct: number
  valueLabel: string
  goalLabel: string
  colorFrom: string
  colorTo: string
  showCheck?: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <Ring pct={pct} colorFrom={colorFrom} colorTo={colorTo}>
        {showCheck ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: `linear-gradient(135deg, ${colorFrom}, ${colorTo})` }}>
            <Check className="size-4 text-white" strokeWidth={3} />
          </div>
        ) : (
          <Icon className="size-5" style={{ color: colorTo }} strokeWidth={2.25} />
        )}
      </Ring>
      <div className="text-center">
        <p className="text-sm font-bold leading-tight">
          {valueLabel} <span className="text-muted-foreground font-normal text-xs">{goalLabel}</span>
        </p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}
