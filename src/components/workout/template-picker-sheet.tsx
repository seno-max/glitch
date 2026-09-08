import { useState } from 'react'
import { ClipboardList, ChevronRight } from 'lucide-react'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { useWorkoutTemplates } from '@/hooks/use-workout'
import { workoutService } from '@/services/workout.service'
import { useWorkoutLogStore, type DraftExercise } from '@/stores/workout-log.store'
import { hapticTap } from '@/utils/haptics'
import toast from 'react-hot-toast'

/**
 * Bottom sheet for one-tap "load exercises from a saved template" — speeds
 * up logging a familiar routine without retyping every exercise name.
 * Fills the draft exercise list with sensible defaults (target sets/reps),
 * which the user can still tweak per-set before saving.
 */
export function TemplatePickerSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: templates, isLoading } = useWorkoutTemplates()
  const { addExercise } = useWorkoutLogStore()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handlePick = async (templateId: string) => {
    setLoadingId(templateId)
    hapticTap()
    try {
      const exs = await workoutService.getTemplateExercises(templateId)
      for (const ex of exs) {
        const draft: DraftExercise = {
          tempId: `${templateId}-${ex.id}`,
          exercise_name: ex.exercise_name,
          equipment: 'other',
          isMachineCardio: false,
          weight_kg: null,
          sets: ex.target_sets ?? 3,
          reps: ex.target_reps ?? 10,
          duration_seconds: null,
          duration_unit: 'sec',
          distance_km: null,
          rest_seconds: null,
          rpe: null,
          notes: null,
        }
        addExercise(draft)
      }
      toast.success(`Loaded ${exs.length} exercise${exs.length === 1 ? '' : 's'} from template`)
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load template')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <BottomSheet open={open} onOpenChange={(o) => !o && onClose()} title="Load from Template">
      <div className="space-y-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Loading templates...</p>
        ) : templates && templates.length > 0 ? (
          templates.map((t) => (
            <button
              key={t.id}
              onClick={() => handlePick(t.id)}
              disabled={loadingId === t.id}
              className="w-full flex items-center gap-3 rounded-2xl border border-border p-3.5 hover:border-primary/30 hover:bg-muted/40 transition-colors text-left disabled:opacity-50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl gradient-primary">
                <ClipboardList className="size-4.5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{t.name}</p>
                {t.category && <p className="text-xs text-muted-foreground">{t.category}</p>}
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>
          ))
        ) : (
          <p className="text-sm text-muted-foreground py-6 text-center">No templates yet — create one from the Templates page.</p>
        )}
      </div>
    </BottomSheet>
  )
}
