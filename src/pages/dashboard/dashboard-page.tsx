import { useDashboard } from '@/hooks/use-dashboard'
import { HeroHealthCard } from '@/components/dashboard/hero-health-card'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { HabitsCard } from '@/components/dashboard/habits-card'
import { TodaysProgress } from '@/components/dashboard/todays-progress'
import { PeriodProgressCard } from '@/components/dashboard/period-progress-card'
import { MoreFeaturesGrid } from '@/components/dashboard/more-features-grid'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDisplayDate } from '@/utils/date'

export default function DashboardPage() {
  const { data, isLoading } = useDashboard()

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-56 w-full rounded-3xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground mb-3">{formatDisplayDate(data.date)}</p>
        <HeroHealthCard summary={data} />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 px-1">Quick Actions</h2>
        <QuickActions />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <HabitsCard habitsToday={data.habitsToday} />
        <TodaysProgress progress={data.todaysProgress} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <PeriodProgressCard progress={data.weeklyProgress} />
        <PeriodProgressCard progress={data.monthlyProgress} />
      </div>

      <MoreFeaturesGrid />
    </div>
  )
}
