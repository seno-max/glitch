import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Dumbbell,
  Bike,
  Waves,
  Zap,
  StretchHorizontal,
  Move,
  Flower2,
  Play,
  ClipboardList,
  BookOpen,
  History,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useActiveWorkoutStore } from '@/stores/active-workout.store'
import { useStartWorkout, useWorkoutHistory } from '@/hooks/use-workout'
import type { WorkoutType } from '@/types/database.types'
import { format, parseISO } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'

const WORKOUT_TYPES: { type: WorkoutType; label: string; icon: typeof Dumbbell; gradient: string }[] = [
  { type: 'strength', label: 'Strength Training', icon: Dumbbell, gradient: 'gradient-primary' },
  { type: 'machine_cardio', label: 'Machine Cardio', icon: Bike, gradient: 'gradient-accent' },
  { type: 'outdoor_cardio', label: 'Outdoor Cardio', icon: Waves, gradient: 'bg-gradient-to-br from-cyan-400 to-blue-500' },
  { type: 'functional', label: 'Functional', icon: Move, gradient: 'gradient-secondary' },
  { type: 'hiit', label: 'HIIT', icon: Zap, gradient: 'gradient-fire' },
  { type: 'stretching', label: 'Stretching', icon: StretchHorizontal, gradient: 'bg-gradient-to-br from-teal-400 to-emerald-500' },
  { type: 'mobility', label: 'Mobility', icon: Move, gradient: 'bg-gradient-to-br from-indigo-400 to-purple-500' },
  { type: 'yoga', label: 'Yoga', icon: Flower2, gradient: 'bg-gradient-to-br from-pink-400 to-rose-500' },
]

export default function WorkoutHomePage() {
  const navigate = useNavigate()
  const [selectedTypes, setSelectedTypes] = useState<WorkoutType[]>([])
  const startWorkout = useStartWorkout()
  const activeWorkoutStore = useActiveWorkoutStore()
  const { data: history, isLoading: historyLoading } = useWorkoutHistory(5)

  const toggleType = (type: WorkoutType) => {
    setSelectedTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]))
  }

  const handleStart = async () => {
    if (selectedTypes.length === 0) return
    const session = await startWorkout.mutateAsync({ types: selectedTypes })
    activeWorkoutStore.startWorkout(selectedTypes)
    activeWorkoutStore.setSessionId(session.id)
    navigate('/workout/active')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Workout</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/workout/exercises')}>
            <BookOpen className="size-4" /> Exercise Library
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/workout/templates')}>
            <ClipboardList className="size-4" /> Templates
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>What are you training today?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {WORKOUT_TYPES.map((wt, i) => {
              const selected = selectedTypes.includes(wt.type)
              return (
                <motion.button
                  key={wt.type}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => toggleType(wt.type)}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all',
                    selected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                  )}
                >
                  <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', wt.gradient)}>
                    <wt.icon className="size-5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-center">{wt.label}</span>
                </motion.button>
              )
            })}
          </div>

          <Button
            variant="gradient"
            size="lg"
            className="w-full mt-6"
            disabled={selectedTypes.length === 0 || startWorkout.isPending}
            onClick={handleStart}
          >
            <Play className="size-5" /> Start Workout
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="size-4" /> Recent Workouts
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/workout/history')}>
            View all
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {historyLoading ? (
            <>
              <Skeleton className="h-14 rounded-xl" />
              <Skeleton className="h-14 rounded-xl" />
            </>
          ) : history && history.length > 0 ? (
            history.map((session) => (
              <div key={session.id} className="flex items-center justify-between rounded-xl bg-muted/40 p-3">
                <div>
                  <p className="font-medium text-sm">{session.title || session.workout_types.join(', ').replace(/_/g, ' ')}</p>
                  <p className="text-xs text-muted-foreground">{format(parseISO(session.date), 'MMM d, yyyy')}</p>
                </div>
                <span className="text-sm text-muted-foreground">
                  {session.duration_minutes ? `${Math.round(session.duration_minutes)} min` : 'In progress'}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">No workouts logged yet. Start your first one above!</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
