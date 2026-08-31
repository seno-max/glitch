import { motion } from 'framer-motion'
import { Trophy, Lock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAchievements } from '@/hooks/use-analytics'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

export default function AchievementsPage() {
  const { data: achievements, isLoading } = useAchievements()

  const unlockedCount = achievements?.filter((a) => a.unlocked).length ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="size-6 text-amber-500" /> Achievements
        </h1>
        <span className="text-sm font-semibold text-muted-foreground">
          {unlockedCount}/{achievements?.length ?? 0} unlocked
        </span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {achievements?.map((ach, i) => (
            <motion.div key={ach.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}>
              <Card className={cn('card-hover text-center overflow-hidden relative', !ach.unlocked && 'opacity-60')}>
                {ach.unlocked && <div className="absolute inset-0 gradient-primary opacity-5" />}
                <CardContent className="p-4 flex flex-col items-center gap-2 relative z-10">
                  <div className={cn('flex h-14 w-14 items-center justify-center rounded-2xl text-2xl', ach.unlocked ? 'gradient-fire' : 'bg-muted')}>
                    {ach.unlocked ? ach.icon : <Lock className="size-5 text-muted-foreground" />}
                  </div>
                  <p className="font-semibold text-sm">{ach.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{ach.description}</p>
                  {ach.unlocked && ach.unlockedAt && (
                    <p className="text-[10px] text-primary font-medium">{format(parseISO(ach.unlockedAt), 'MMM d, yyyy')}</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
