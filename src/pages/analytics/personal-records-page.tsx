import { Trophy } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { usePersonalRecords } from '@/hooks/use-analytics'
import { format, parseISO } from 'date-fns'
import type { PRCategory } from '@/types/database.types'

const CATEGORY_LABELS: Record<PRCategory, string> = {
  highest_weight: 'Highest Weight Lifted',
  longest_workout: 'Longest Workout',
  fastest_run: 'Fastest Run',
  longest_run: 'Longest Run',
  longest_cardio_session: 'Longest Cardio Session',
  most_steps: 'Most Steps in a Day',
  longest_gym_streak: 'Longest Gym Streak',
  most_water: 'Most Water Consumed',
  lowest_weight: 'Lowest Body Weight',
  highest_workout_volume: 'Highest Workout Volume',
}

const CATEGORY_ICONS: Record<PRCategory, string> = {
  highest_weight: '🏋️',
  longest_workout: '⏱️',
  fastest_run: '🏃',
  longest_run: '🛣️',
  longest_cardio_session: '🚴',
  most_steps: '👣',
  longest_gym_streak: '🔥',
  most_water: '💧',
  lowest_weight: '⚖️',
  highest_workout_volume: '💪',
}

export default function PersonalRecordsPage() {
  const { data: records, isLoading } = usePersonalRecords()

  const grouped = records?.reduce<Record<string, typeof records>>((acc, r) => {
    if (!acc[r.category]) acc[r.category] = []
    acc[r.category]!.push(r)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Trophy className="size-6 text-amber-500" /> Personal Records
      </h1>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : grouped && Object.keys(grouped).length > 0 ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {Object.entries(grouped).map(([category, recs]) => {
            const best = recs![0]
            return (
              <Card key={category} className="card-hover">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-fire text-2xl shrink-0">
                    {CATEGORY_ICONS[category as PRCategory]}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{CATEGORY_LABELS[category as PRCategory]}</p>
                    <p className="text-xl font-bold">
                      {best.value} {best.unit}
                    </p>
                    {best.context && <p className="text-xs text-muted-foreground">{best.context}</p>}
                    <p className="text-[10px] text-primary font-medium mt-0.5">{format(parseISO(best.achieved_date), 'MMM d, yyyy')}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState icon={Trophy} title="No personal records yet" description="Keep training — PRs will appear here automatically!" />
      )}
    </div>
  )
}
