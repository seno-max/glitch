import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, ClipboardList } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog'
import { Select } from '@/components/ui/select'
import { useWorkoutTemplates } from '@/hooks/use-workout'
import { useAuthStore } from '@/stores/auth.store'
import { workoutService } from '@/services/workout.service'
import toast from 'react-hot-toast'

const CATEGORIES = ['Chest', 'Back', 'Shoulders', 'Legs', 'Arms', 'Push', 'Pull', 'Upper', 'Lower', 'Full Body', 'Custom']

export default function WorkoutTemplatesPage() {
  const { user } = useAuthStore()
  const { data: templates, isLoading } = useWorkoutTemplates()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Custom')
  const [exercises, setExercises] = useState<string[]>([''])
  const [saving, setSaving] = useState(false)

  const reset = () => {
    setName('')
    setCategory('Custom')
    setExercises([''])
  }

  const handleCreate = async () => {
    if (!user || !name.trim()) return
    setSaving(true)
    try {
      await workoutService.createTemplate(
        { user_id: user.id, name, category, description: null, is_custom: true },
        exercises
          .filter((e) => e.trim())
          .map((e, i) => ({ exercise_id: null, exercise_name: e, target_sets: 3, target_reps: 10, order_index: i }))
      )
      toast.success('Template created!')
      queryClient.invalidateQueries({ queryKey: ['workout-templates'] })
      setOpen(false)
      reset()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create template')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    await workoutService.deleteTemplate(id)
    queryClient.invalidateQueries({ queryKey: ['workout-templates'] })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Workout Templates</h1>
        <Button variant="gradient" onClick={() => setOpen(true)}>
          <Plus className="size-4" /> New Template
        </Button>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      ) : templates && templates.length > 0 ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {templates.map((t) => (
            <Card key={t.id} className="card-hover">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{t.name}</p>
                  {t.category && <Badge variant="outline" className="mt-1">{t.category}</Badge>}
                </div>
                <button onClick={() => handleDelete(t.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="size-4" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={ClipboardList} title="No templates yet" description="Create reusable workout templates to speed up logging." actionLabel="Create Template" onAction={() => setOpen(true)} />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Workout Template</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground">Template Name</label>
              <Input placeholder="e.g. Push Day" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Category</label>
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Exercises</label>
              <div className="space-y-2">
                {exercises.map((ex, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      placeholder={`Exercise ${i + 1}`}
                      value={ex}
                      onChange={(e) => setExercises((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setExercises((prev) => prev.filter((_, idx) => idx !== i))}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setExercises((prev) => [...prev, ''])}>
                  <Plus className="size-4" /> Add Exercise
                </Button>
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="gradient" onClick={handleCreate} disabled={saving || !name.trim()}>
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
