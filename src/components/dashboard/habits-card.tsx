import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog'
import { Plus, Minus, Check, Pencil, Trash2, ListChecks } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/shared/empty-state'
import { useCreateHabit, useUpdateHabit, useDeleteHabit, useCheckInHabit, useUncheckHabit } from '@/hooks/use-habits'
import type { HabitProgress } from '@/types/models'
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

export function HabitsCard({ habitsToday }: { habitsToday: HabitProgress[] }) {
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Habit | null>(null)
  const [form, setForm] = useState<HabitFormState>(emptyForm)

  const createHabit = useCreateHabit()
  const updateHabit = useUpdateHabit()
  const deleteHabit = useDeleteHabit()
  const checkIn = useCheckInHabit()
  const uncheck = useUncheckHabit()

  const openCreate = () => {
    setForm(emptyForm)
    setEditing(null)
    setCreateOpen(true)
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
    setCreateOpen(true)
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
    setCreateOpen(false)
  }

  const handleDelete = async () => {
    if (!editing) return
    await deleteHabit.mutateAsync(editing.id)
    setCreateOpen(false)
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
        {habitsToday.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title="No habits yet"
            description="Create your own daily habits — pick the name, how many times a day, and an optional reward."
            actionLabel="Create Your First Habit"
            onAction={openCreate}
          />
        ) : (
          habitsToday.map((hp, i) => (
            <motion.div
              key={hp.habit.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-muted transition-colors group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0 text-lg">{hp.habit.icon}</div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-medium truncate', hp.completed && 'text-success')}>{hp.habit.name}</p>
                <p className="text-xs text-muted-foreground">
                  {hp.checkedCount}/{hp.habit.target_count} today
                  {hp.habit.points ? ` · +${hp.habit.points} pts` : ''}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {hp.checkedCount > 0 && (
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => uncheck.mutate(hp.habit.id)}
                    disabled={uncheck.isPending}
                    title="Remove one check"
                  >
                    <Minus className="size-3.5" />
                  </Button>
                )}
                <Button
                  variant={hp.completed ? 'default' : 'gradient'}
                  size="icon-sm"
                  onClick={() => checkIn.mutate(hp.habit)}
                  disabled={checkIn.isPending || hp.checkedCount >= hp.habit.target_count}
                  title="Check in"
                >
                  <Check className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => openEdit(hp.habit)}
                  title="Edit habit"
                >
                  <Pencil className="size-3.5" />
                </Button>
              </div>
            </motion.div>
          ))
        )}
      </CardContent>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
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
              <Label>How many times per day?</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={form.target_count}
                onChange={(e) => setForm((f) => ({ ...f, target_count: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Some habits are once a day, others (like stretching or water breaks) might be several times a day — your choice.
              </p>
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
              <p className="text-xs text-muted-foreground mt-1 mb-2">Optional — not every habit needs a reward.</p>
              {form.hasReward && (
                <Input
                  type="number"
                  min={0}
                  placeholder="Points (e.g. 20)"
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
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
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
