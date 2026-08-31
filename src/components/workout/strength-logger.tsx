import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useActiveWorkoutStore } from '@/stores/active-workout.store'
import type { EquipmentType } from '@/types/database.types'
import { exerciseLibraryService } from '@/services/exercise-library.service'
import { useQuery } from '@tanstack/react-query'

const EQUIPMENT_OPTIONS: EquipmentType[] = ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'kettlebell', 'band', 'other']

export function StrengthLogger() {
  const { draftStrength, addStrengthExercise, updateStrengthExercise, removeStrengthExercise } = useActiveWorkoutStore()
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  const { data: exerciseResults } = useQuery({
    queryKey: ['exercise-search', search],
    queryFn: () => exerciseLibraryService.search(search),
    enabled: search.length > 1,
  })

  const addExercise = (name: string) => {
    addStrengthExercise({
      tempId: crypto.randomUUID(),
      exercise_name: name,
      equipment: 'barbell',
      weight_kg: 0,
      sets: 3,
      reps: 10,
      rest_seconds: 60,
      order_index: draftStrength.length,
    })
    setSearch('')
    setShowSearch(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Strength Exercises</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {draftStrength.map((ex) => (
          <motion.div
            key={ex.tempId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold">{ex.exercise_name}</p>
              <button onClick={() => removeStrengthExercise(ex.tempId)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="size-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Equipment</label>
                <Select value={ex.equipment} onChange={(e) => updateStrengthExercise(ex.tempId, { equipment: e.target.value as EquipmentType })}>
                  {EQUIPMENT_OPTIONS.map((eq) => (
                    <option key={eq} value={eq}>
                      {eq}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Weight (kg)</label>
                <Input
                  type="number"
                  step="0.5"
                  value={ex.weight_kg ?? 0}
                  onChange={(e) => updateStrengthExercise(ex.tempId, { weight_kg: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Sets</label>
                <Input
                  type="number"
                  value={ex.sets ?? 1}
                  onChange={(e) => updateStrengthExercise(ex.tempId, { sets: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Reps</label>
                <Input
                  type="number"
                  value={ex.reps ?? 1}
                  onChange={(e) => updateStrengthExercise(ex.tempId, { reps: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Rest (sec)</label>
                <Input
                  type="number"
                  value={ex.rest_seconds ?? 60}
                  onChange={(e) => updateStrengthExercise(ex.tempId, { rest_seconds: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">RPE (1-10)</label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={ex.rpe ?? ''}
                  onChange={(e) => updateStrengthExercise(ex.tempId, { rpe: Number(e.target.value) })}
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground">Volume</label>
                <p className="h-11 flex items-center font-semibold text-primary">
                  {((ex.weight_kg ?? 0) * (ex.sets ?? 0) * (ex.reps ?? 0)).toLocaleString()} kg
                </p>
              </div>
            </div>
            <Input placeholder="Notes (optional)" value={ex.notes ?? ''} onChange={(e) => updateStrengthExercise(ex.tempId, { notes: e.target.value })} />
          </motion.div>
        ))}

        {showSearch ? (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                autoFocus
                className="pl-9"
                placeholder="Search exercises (e.g. Bench Press)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {exerciseResults && exerciseResults.length > 0 && (
              <div className="rounded-xl border border-border divide-y divide-border max-h-56 overflow-y-auto">
                {exerciseResults.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => addExercise(ex.name)}
                    className="w-full text-left px-4 py-2.5 hover:bg-muted transition-colors text-sm"
                  >
                    <span className="font-medium">{ex.name}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{ex.target_muscle}</span>
                  </button>
                ))}
              </div>
            )}
            {search.length > 1 && (
              <Button variant="outline" size="sm" className="w-full" onClick={() => addExercise(search)}>
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
