import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useWorkoutLogStore } from '@/stores/workout-log.store'
import { exerciseLibraryService } from '@/services/exercise-library.service'
import { useQuery } from '@tanstack/react-query'

/**
 * Unified exercise logger for the manual gym-log workflow. A single entry
 * captures whatever is relevant: sets + reps + weight for strength work,
 * and/or sets + duration (seconds) for timed/cardio-style exercises like
 * "30 secs x 3 sets" burpees. Fields left blank are simply not recorded.
 */
export function ExerciseLogger() {
  const { exercises, addExercise, updateExercise, removeExercise } = useWorkoutLogStore()
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  const { data: exerciseResults } = useQuery({
    queryKey: ['exercise-search', search],
    queryFn: () => exerciseLibraryService.search(search),
    enabled: search.length > 1,
  })

  const addNewExercise = (name: string) => {
    addExercise({
      tempId: crypto.randomUUID(),
      exercise_name: name,
      equipment: 'bodyweight',
      weight_kg: null,
      sets: 3,
      reps: 10,
      duration_seconds: null,
      rest_seconds: null,
      rpe: null,
      notes: null,
    })
    setSearch('')
    setShowSearch(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exercises</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {exercises.map((ex) => (
          <motion.div
            key={ex.tempId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold">{ex.exercise_name}</p>
              <button onClick={() => removeExercise(ex.tempId)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="size-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Sets</label>
                <Input
                  type="number"
                  min={1}
                  value={ex.sets}
                  onChange={(e) => updateExercise(ex.tempId, { sets: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Reps</label>
                <Input
                  type="number"
                  placeholder="optional"
                  value={ex.reps ?? ''}
                  onChange={(e) => updateExercise(ex.tempId, { reps: e.target.value === '' ? null : Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Weight (kg)</label>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="optional"
                  value={ex.weight_kg ?? ''}
                  onChange={(e) => updateExercise(ex.tempId, { weight_kg: e.target.value === '' ? null : Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Timing (sec / set)</label>
                <Input
                  type="number"
                  placeholder="e.g. 30"
                  value={ex.duration_seconds ?? ''}
                  onChange={(e) => updateExercise(ex.tempId, { duration_seconds: e.target.value === '' ? null : Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Rest (sec)</label>
                <Input
                  type="number"
                  placeholder="optional"
                  value={ex.rest_seconds ?? ''}
                  onChange={(e) => updateExercise(ex.tempId, { rest_seconds: e.target.value === '' ? null : Number(e.target.value) })}
                />
              </div>
            </div>
            <Input
              placeholder="Notes (optional)"
              value={ex.notes ?? ''}
              onChange={(e) => updateExercise(ex.tempId, { notes: e.target.value || null })}
            />
          </motion.div>
        ))}

        {showSearch ? (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                autoFocus
                className="pl-9"
                placeholder="Search exercises (e.g. Burpees, Bench Press)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {exerciseResults && exerciseResults.length > 0 && (
              <div className="rounded-xl border border-border divide-y divide-border max-h-56 overflow-y-auto">
                {exerciseResults.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => addNewExercise(ex.name)}
                    className="w-full text-left px-4 py-2.5 hover:bg-muted transition-colors text-sm"
                  >
                    <span className="font-medium">{ex.name}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{ex.target_muscle}</span>
                  </button>
                ))}
              </div>
            )}
            {search.length > 1 && (
              <Button variant="outline" size="sm" className="w-full" onClick={() => addNewExercise(search)}>
                Add "{search}" as custom exercise
              </Button>
            )}
          </div>
        ) : (
          <Button variant="outline" className="w-full" onClick={() => setShowSearch(true)}>
            <Plus className="size-4" /> Add Exercise
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
