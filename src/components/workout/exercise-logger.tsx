import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Search, Sparkles, Timer, Dumbbell, Zap, Bike } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { RestTimerHost } from '@/components/workout/rest-timer'
import { useWorkoutLogStore, type DraftExercise } from '@/stores/workout-log.store'
import { exerciseLibraryService } from '@/services/exercise-library.service'
import { useAuthStore } from '@/stores/auth.store'
import { useQuery } from '@tanstack/react-query'
import { useSingleFlight } from '@/hooks/use-single-flight'
import { cn } from '@/lib/utils'
import { hapticTap } from '@/utils/haptics'
import toast from 'react-hot-toast'

const NEW_EXERCISE_TAGS = ['Cardio', 'HIIT', 'Chest', 'Back', 'Shoulders', 'Legs', 'Arms', 'Core', 'Full Body', 'Yoga', 'Mobility']

type Group = 'strength' | 'timed' | 'machine'

function groupOf(ex: DraftExercise): Group {
  if (ex.isMachineCardio) return 'machine'
  if (ex.duration_seconds && !ex.reps) return 'timed'
  return 'strength'
}

const GROUP_META: Record<Group, { label: string; icon: typeof Dumbbell; gradient: string }> = {
  strength: { label: 'Strength', icon: Dumbbell, gradient: 'from-emerald-400 to-teal-600' },
  timed: { label: 'Timed / HIIT', icon: Zap, gradient: 'from-orange-400 to-red-500' },
  machine: { label: 'Machine Cardio', icon: Bike, gradient: 'from-sky-400 to-blue-600' },
}

/**
 * Unified exercise logger for the manual gym-log workflow. An entry is one
 * of three styles depending on what's filled in:
 *  - Strength: sets + reps + weight
 *  - Timed bodyweight sets: sets + duration (sec, per set) e.g. burpees
 *  - Machine cardio: no sets/reps at all, just distance and/or a duration
 *    the user can enter in seconds OR minutes (their choice) since machine
 *    cardio is normally tracked in minutes, not "seconds per set".
 *
 * Exercises are grouped visually (Strength / Timed-HIIT / Machine Cardio)
 * and each card has a delete button that prompts a confirmation dialog
 * before removing the exercise.
 *
 * Typing a brand-new exercise name (one not already in the library) prompts
 * to save it to the shared exercise library with a tag, so it shows up in
 * the dropdown/search next time instead of needing to be retyped.
 */
export function ExerciseLogger({ readOnly = false }: { readOnly?: boolean } = {}) {
  const { user } = useAuthStore()
  const { exercises, addExercise, updateExercise, removeExercise } = useWorkoutLogStore()
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [saveDialog, setSaveDialog] = useState<{ name: string; tempId: string } | null>(null)
  const [newExTag, setNewExTag] = useState('Cardio')
  const [newExIsMachineCardio, setNewExIsMachineCardio] = useState(false)
  const [restSeconds, setRestSeconds] = useState<number | null>(null)

  const { data: exerciseResults } = useQuery({
    queryKey: ['exercise-search', search],
    queryFn: () => exerciseLibraryService.search(search),
    enabled: search.length > 1,
  })

  const addNewExercise = (name: string, opts?: { isMachineCardio?: boolean }) => {
    const isMachineCardio = opts?.isMachineCardio ?? false
    const tempId = crypto.randomUUID()
    addExercise({
      tempId,
      exercise_name: name,
      equipment: isMachineCardio ? 'machine' : 'bodyweight',
      isMachineCardio,
      weight_kg: null,
      sets: isMachineCardio ? null : 3,
      reps: isMachineCardio ? null : 10,
      duration_seconds: null,
      duration_unit: isMachineCardio ? 'min' : 'sec',
      distance_km: null,
      rest_seconds: null,
      rpe: null,
      notes: null,
    })
    setSearch('')
    setShowSearch(false)
    return tempId
  }

  /** Pick from search results — known machine-cardio-category exercises
   * default into the no-sets/reps machine cardio layout automatically. */
  const pickExisting = (name: string, category: string | null, equipment: string) => {
    const isMachineCardio = equipment === 'machine' && (category === 'Cardio' || category === 'HIIT')
    addNewExercise(name, { isMachineCardio })
  }

  /** Typed a name that's not in the library — add it as a draft entry, then
   * ask (via dialog) whether to also save it to the shared library. */
  const addCustomTyped = async () => {
    const name = search.trim()
    if (!name) return
    const existing = await exerciseLibraryService.findByExactName(name)
    if (existing) {
      pickExisting(existing.name, existing.category, existing.equipment)
      return
    }
    addNewExercise(name)
    setSaveDialog({ name, tempId: '' })
    setNewExTag('Cardio')
    setNewExIsMachineCardio(false)
  }

  const [confirmSaveToLibrary, savingToLibrary] = useSingleFlight(async () => {
    if (!saveDialog || !user) return
    try {
      await exerciseLibraryService.createCustom(user.id, {
        name: saveDialog.name,
        target_muscle: newExTag === 'Cardio' || newExTag === 'HIIT' ? 'Cardio' : newExTag,
        secondary_muscles: [],
        equipment: newExIsMachineCardio ? 'machine' : 'bodyweight',
        difficulty: 'beginner',
        instructions: null,
        media_url: null,
        category: newExTag,
      })
      toast.success(`"${saveDialog.name}" added to your exercise library`)
    } catch {
      toast.error('Could not save to exercise library, but it\u2019s still logged for today')
    }
    setSaveDialog(null)
  })

  const grouped: Record<Group, DraftExercise[]> = { strength: [], timed: [], machine: [] }
  for (const ex of exercises) grouped[groupOf(ex)].push(ex)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exercises</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {exercises.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">No exercises added yet. Search or add one below.</p>
        )}

        {(['strength', 'timed', 'machine'] as Group[]).map((g) => {
          const meta = GROUP_META[g]
          const GroupIcon = meta.icon
          return grouped[g].length > 0 ? (
            <div key={g} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className={cn('flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br shrink-0', meta.gradient)}>
                  <GroupIcon className="size-3.5 text-white" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{meta.label}</p>
              </div>
              <AnimatePresence initial={false}>
                {grouped[g].map((ex) => (
                  <ExerciseRow
                    key={ex.tempId}
                    ex={ex}
                    readOnly={readOnly}
                    onUpdate={(patch) => updateExercise(ex.tempId, patch)}
                    onRemove={() => removeExercise(ex.tempId)}
                    onStartRest={() => ex.rest_seconds && setRestSeconds(ex.rest_seconds)}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : null
        })}

        {readOnly ? null : showSearch ? (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                autoFocus
                className="pl-9"
                placeholder="Search exercises (e.g. Burpees, Recumbent Bike)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {exerciseResults && exerciseResults.length > 0 && (
              <div className="rounded-xl border border-border divide-y divide-border max-h-56 overflow-y-auto">
                {exerciseResults.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => pickExisting(ex.name, ex.category, ex.equipment)}
                    className="w-full text-left px-4 py-2.5 hover:bg-muted transition-colors text-sm"
                  >
                    <span className="font-medium">{ex.name}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{ex.category || ex.target_muscle}</span>
                  </button>
                ))}
              </div>
            )}
            {search.length > 1 && (!exerciseResults || !exerciseResults.some((e) => e.name.toLowerCase() === search.trim().toLowerCase())) && (
              <Button variant="outline" size="sm" className="w-full" onClick={addCustomTyped}>
                <Plus className="size-3.5" /> Add "{search}" as a new exercise
              </Button>
            )}
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              hapticTap()
              setShowSearch(true)
            }}
          >
            <Plus className="size-4" /> Add Exercise
          </Button>
        )}
      </CardContent>

      <Dialog open={!!saveDialog} onOpenChange={(open) => !open && setSaveDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-primary" /> Save to Exercise Library?
            </DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <p className="text-sm text-muted-foreground">
              "{saveDialog?.name}" isn't in your exercise library yet. Save it so you can pick it from search next time instead of typing it again.
            </p>
            <div>
              <Label>Tag</Label>
              <Select value={newExTag} onChange={(e) => setNewExTag(e.target.value)}>
                {NEW_EXERCISE_TAGS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={newExIsMachineCardio}
                onChange={(e) => setNewExIsMachineCardio(e.target.checked)}
                className="size-4 rounded accent-primary"
              />
              This is a machine cardio exercise (no sets/reps — just distance & time)
            </label>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSaveDialog(null)}>
              Skip
            </Button>
            <Button variant="gradient" onClick={confirmSaveToLibrary} disabled={savingToLibrary}>
              Save to Library
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RestTimerHost activeSeconds={restSeconds} onClose={() => setRestSeconds(null)} />
    </Card>
  )
}

function ExerciseRow({
  ex,
  readOnly = false,
  onUpdate,
  onRemove,
  onStartRest,
}: {
  ex: DraftExercise
  readOnly?: boolean
  onUpdate: (patch: Partial<DraftExercise>) => void
  onRemove: () => void
  onStartRest: () => void
}) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -80, height: 0, marginBottom: 0 }}
      className="relative"
    >
      <div className="relative rounded-2xl border-2 border-border bg-card p-4 sm:p-5 space-y-3 shadow-sm transition-shadow hover:border-primary/30 hover:shadow-md">
        <div className="flex items-center justify-between">
          <p className="font-bold text-base">{ex.exercise_name}</p>
          {!readOnly && (
            <button
              onClick={() => {
                hapticTap()
                setConfirmOpen(true)
              }}
              className="text-muted-foreground hover:text-destructive p-1 -m-1"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>

        {ex.isMachineCardio ? (
          // Machine cardio: no sets/reps at all, just distance + a duration
          // the user can log in whichever unit fits (mins for a 20-min bike
          // session, secs if they prefer).
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">Distance (km)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g. 5"
                disabled={readOnly}
                value={ex.distance_km ?? ''}
                onChange={(e) => onUpdate({ distance_km: e.target.value === '' ? null : Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Duration</label>
              <Input
                type="number"
                placeholder={ex.duration_unit === 'min' ? 'e.g. 20' : 'e.g. 1200'}
                disabled={readOnly}
                value={ex.duration_seconds ?? ''}
                onChange={(e) => onUpdate({ duration_seconds: e.target.value === '' ? null : Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Unit</label>
              <div className="flex rounded-xl border border-input overflow-hidden h-11">
                {(['min', 'sec'] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    disabled={readOnly}
                    onClick={() => onUpdate({ duration_unit: u })}
                    className={cn(
                      'flex-1 text-sm font-medium transition-colors disabled:opacity-50',
                      ex.duration_unit === u ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                    )}
                  >
                    {u === 'min' ? 'Mins' : 'Secs'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">Sets</label>
              <Input
                type="number"
                min={1}
                disabled={readOnly}
                value={ex.sets ?? ''}
                onChange={(e) => onUpdate({ sets: e.target.value === '' ? null : Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Reps</label>
              <Input
                type="number"
                placeholder="optional"
                disabled={readOnly}
                value={ex.reps ?? ''}
                onChange={(e) => onUpdate({ reps: e.target.value === '' ? null : Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Weight (kg)</label>
              <Input
                type="number"
                step="0.5"
                placeholder="optional"
                disabled={readOnly}
                value={ex.weight_kg ?? ''}
                onChange={(e) => onUpdate({ weight_kg: e.target.value === '' ? null : Number(e.target.value) })}
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground">Timing (per set)</label>
              <div className="flex gap-1.5">
                <Input
                  type="number"
                  placeholder="e.g. 30"
                  disabled={readOnly}
                  value={ex.duration_seconds ?? ''}
                  onChange={(e) => onUpdate({ duration_seconds: e.target.value === '' ? null : Number(e.target.value) })}
                />
                <div className="flex rounded-xl border border-input overflow-hidden shrink-0">
                  {(['sec', 'min'] as const).map((u) => (
                    <button
                      key={u}
                      type="button"
                      disabled={readOnly}
                      onClick={() => onUpdate({ duration_unit: u })}
                      className={cn(
                        'px-2.5 text-xs font-medium transition-colors disabled:opacity-50',
                        ex.duration_unit === u ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                      )}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Distance (km)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="optional"
                disabled={readOnly}
                value={ex.distance_km ?? ''}
                onChange={(e) => onUpdate({ distance_km: e.target.value === '' ? null : Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Rest (sec)</label>
              <Input
                type="number"
                placeholder="optional"
                disabled={readOnly}
                value={ex.rest_seconds ?? ''}
                onChange={(e) => onUpdate({ rest_seconds: e.target.value === '' ? null : Number(e.target.value) })}
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Input placeholder="Notes (optional)" value={ex.notes ?? ''} disabled={readOnly} onChange={(e) => onUpdate({ notes: e.target.value || null })} className="flex-1" />
          {!!ex.rest_seconds && (
            <Button variant="outline" size="sm" onClick={onStartRest} className="shrink-0">
              <Timer className="size-3.5" /> Rest
            </Button>
          )}
        </div>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Remove exercise?"
        description={`Remove "${ex.exercise_name}" from this workout log?`}
        confirmLabel="Remove"
        onConfirm={onRemove}
      />
    </motion.div>
  )
}
