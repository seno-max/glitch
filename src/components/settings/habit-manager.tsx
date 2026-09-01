import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, ListChecks } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/shared/empty-state'
import { useHabits, useCreateHabit, useUpdateHabit, useDeleteHabit } from '@/hooks/use-habits'
import type { Habit } from '@/types/database.types'

const EMOJI_CHOICES = ['⭐', '💧', '🧘', '🚶', '🐕', '📚', '🧹', '🎯', '🧠', '🎸', '☀️', '🌙', '🥗', '🚭', '💊', '🧴', '🎨', '🙏']

interface HabitFormState {
  name: string
  icon: string
  target_count: string
  points: string
  hasReward: boolean
}

const emptyForm: HabitFormState = { name: '', icon: '⭐', target_count: '1', points: '', hasReward: false }

export function HabitManager() {
  const { data: habits } = useHabits(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Habit | null>(null)
  const [form, setForm] = useState<HabitFormState>(emptyForm)

  const createHabit = useCreateHabit()
  const updateHabit = useUpdateHabit()
  const deleteHabit = useDeleteHabit()

  const openCreate = () => {
    setForm(emptyForm)
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (habit: Habit) => {
    setForm({
      name: habit.name,
      icon: habit.icon,
      target_count: String(habit.target_count),
      points: habit.points ? String(habit.points) : '',
      hasReward: !!habit.points && habit.points > 0,
    })
    setEditing(habit)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    const payload = {
      name: form.name.trim(),
      icon: form.icon,
      target_count: Math.max(1, Number(form.target_count) || 1),
      points: form.hasReward && form.points ? Math.max(0, Number(form.points)) : null,
    }
    if (editing) {
      await updateHabit.mutateAsync({ id: editing.id, patch: payload })
    } else {
      await createHabit.mutateAsync(payload)
    }
    setDialogOpen(false)
  }

  const handleDelete = async () => {
    if (!editing) return
    await deleteHabit.mutateAsync(editing.id)
    setDialogOpen(false)
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ListChecks className="size-4" /> My Habits
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={openCreate}>
          <Plus className="size-4" /> Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-1">
        {!habits || habits.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title="No habits yet"
            description="Add a habit, choose how many times a day to check it, and optionally set a reward."
            actionLabel="Create Your First Habit"
            onAction={openCreate}
          />
        ) : (
          habits.map((habit) => (
            <div key={habit.id} className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-muted transition-colors">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0 text-lg">{habit.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{habit.name}</p>
                <p className="text-xs text-muted-foreground">
                  {habit.target_count}x/day{habit.points ? ` · +${habit.points} pts` : ''}
                </p>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={() => openEdit(habit)} title="Edit habit">
                <Pencil className="size-3.5" />
              </Button>
            </div>
          ))
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Habit' : 'New Habit'}</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div>
              <Label>Habit Name</Label>
              <Input
                placeholder="e.g. Walk the dog, Read 10 pages, Meditate"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_CHOICES.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, icon: emoji }))}
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-lg border-2 text-lg transition-all',
                      form.icon === emoji ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Times per day</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={form.target_count}
                onChange={(e) => setForm((f) => ({ ...f, target_count: e.target.value }))}
              />
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-primary size-4"
                  checked={form.hasReward}
                  onChange={(e) => setForm((f) => ({ ...f, hasReward: e.target.checked }))}
                />
                <span className="text-sm font-medium">Award points for this habit</span>
              </label>
              {form.hasReward && (
                <Input
                  type="number"
                  min={0}
                  placeholder="Points (e.g. 20)"
                  className="mt-2"
                  value={form.points}
                  onChange={(e) => setForm((f) => ({ ...f, points: e.target.value }))}
                />
              )}
            </div>
          </DialogBody>
          <DialogFooter className="flex-wrap">
            {editing && (
              <Button
                variant="outline"
                className="text-destructive border-destructive/30 hover:bg-destructive/10 mr-auto"
                onClick={handleDelete}
                disabled={deleteHabit.isPending}
              >
                <Trash2 className="size-4" /> Delete
              </Button>
            )}
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="gradient" onClick={handleSave} disabled={!form.name.trim() || createHabit.isPending || updateHabit.isPending}>
              {editing ? 'Save Changes' : 'Create Habit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
