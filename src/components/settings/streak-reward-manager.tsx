import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Plus, Pencil, Trash2, Flame } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'
import { useStreakRewards, useCreateStreakReward, useUpdateStreakReward, useDeleteStreakReward } from '@/hooks/use-streak-rewards'
import type { StreakReward, StreakCategory } from '@/types/database.types'

const CATEGORY_LABEL: Record<StreakCategory, string> = {
  gym: 'Gym Streak',
  steps: 'Step Goal Streak',
}

interface FormState {
  name: string
  category: StreakCategory
  streak_days: string
  points: string
}

const emptyForm: FormState = { name: '', category: 'gym', streak_days: '7', points: '100' }

/**
 * Fully user-defined streak rewards: no built-in "gym streak"/"step
 * streak" template with a fixed day count. The user picks a name, which
 * streak category it tracks, how many consecutive days are required, and
 * how many bonus points to award — and can create as many of these as
 * they want (e.g. "1 week warrior" at 7 days, "unstoppable" at 30 days).
 */
export function StreakRewardManager() {
  const { data: rewards } = useStreakRewards()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<StreakReward | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<StreakReward | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)

  const createReward = useCreateStreakReward()
  const updateReward = useUpdateStreakReward()
  const deleteReward = useDeleteStreakReward()

  const openCreate = () => {
    setForm(emptyForm)
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (reward: StreakReward) => {
    setForm({
      name: reward.name,
      category: reward.category,
      streak_days: String(reward.streak_days),
      points: String(reward.points),
    })
    setEditing(reward)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    const payload = {
      name: form.name.trim(),
      category: form.category,
      streak_days: Math.max(1, Number(form.streak_days) || 1),
      points: Math.max(0, Number(form.points) || 0),
    }
    if (editing) {
      await updateReward.mutateAsync({ id: editing.id, patch: payload })
    } else {
      await createReward.mutateAsync(payload)
    }
    setDialogOpen(false)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await deleteReward.mutateAsync(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Flame className="size-4 text-orange-500" /> Streak Rewards
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={openCreate}>
          <Plus className="size-4" /> Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-1">
        {!rewards || rewards.length === 0 ? (
          <EmptyState
            icon={Flame}
            title="No streak rewards yet"
            description="Create your own streak milestone — pick a name, how many days in a row, and how many points it's worth."
            actionLabel="Create Your First Streak Reward"
            onAction={openCreate}
          />
        ) : (
          rewards.map((reward) => (
            <div key={reward.id} className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-muted transition-colors">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10 shrink-0">
                <Flame className="size-4 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{reward.name}</p>
                <p className="text-xs text-muted-foreground">
                  {CATEGORY_LABEL[reward.category]} · {reward.streak_days} days · +{reward.points} pts
                </p>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={() => openEdit(reward)} title="Edit streak reward">
                <Pencil className="size-3.5" />
              </Button>
            </div>
          ))
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Streak Reward' : 'New Streak Reward'}</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                placeholder="e.g. 1 Week Warrior, Unstoppable"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <Label>Streak Type</Label>
              <Select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as StreakCategory }))}>
                <option value="gym">Gym Streak</option>
                <option value="steps">Step Goal Streak</option>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Consecutive Days</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.streak_days}
                  onChange={(e) => setForm((f) => ({ ...f, streak_days: e.target.value }))}
                />
              </div>
              <div>
                <Label>Bonus Points</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.points}
                  onChange={(e) => setForm((f) => ({ ...f, points: e.target.value }))}
                />
              </div>
            </div>
          </DialogBody>
          <DialogFooter className="flex-wrap">
            {editing && (
              <Button
                variant="outline"
                className="text-destructive border-destructive/30 hover:bg-destructive/10 mr-auto"
                onClick={() => {
                  setDialogOpen(false)
                  setDeleteTarget(editing)
                }}
              >
                <Trash2 className="size-4" /> Delete
              </Button>
            )}
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="gradient" onClick={handleSave} disabled={!form.name.trim() || createReward.isPending || updateReward.isPending}>
              {editing ? 'Save Changes' : 'Create Reward'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this streak reward?"
        description={deleteTarget ? `"${deleteTarget.name}" will no longer award points.` : undefined}
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </Card>
  )
}
