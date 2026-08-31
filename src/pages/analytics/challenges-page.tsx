import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Target, Plus, Zap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog'
import { EmptyState } from '@/components/shared/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { useChallenges } from '@/hooks/use-analytics'
import { useAuthStore } from '@/stores/auth.store'
import { gamificationService } from '@/services/gamification.service'
import { todayStr, weekRange, monthRange } from '@/utils/date'
import type { ChallengePeriod, ChallengeMetric } from '@/types/database.types'
import { format, parseISO } from 'date-fns'
import toast from 'react-hot-toast'

export default function ChallengesPage() {
  const { user } = useAuthStore()
  const { data: challenges, isLoading } = useChallenges()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    title: '',
    period: 'weekly' as ChallengePeriod,
    metric: 'gym_days' as ChallengeMetric,
    target: '',
    rewardXp: '100',
  })

  const handleCreate = async () => {
    if (!user || !form.title.trim() || !form.target) return
    const range = form.period === 'daily' ? { start: todayStr(), end: todayStr() } : form.period === 'weekly' ? weekRange() : monthRange()
    await gamificationService.createChallenge({
      user_id: user.id,
      title: form.title,
      description: null,
      period: form.period,
      metric: form.metric,
      target_value: Number(form.target),
      current_value: 0,
      reward_xp: Number(form.rewardXp),
      start_date: range.start,
      end_date: range.end,
      is_completed: false,
      completed_at: null,
    })
    toast.success('Challenge created!')
    queryClient.invalidateQueries({ queryKey: ['challenges'] })
    setOpen(false)
    setForm({ title: '', period: 'weekly', metric: 'gym_days', target: '', rewardXp: '100' })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Target className="size-6 text-purple-500" /> Challenges
        </h1>
        <Button variant="gradient" onClick={() => setOpen(true)}>
          <Plus className="size-4" /> New Challenge
        </Button>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      ) : challenges && challenges.length > 0 ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {challenges.map((c) => {
            const pct = Math.min(100, Math.round((c.current_value / c.target_value) * 100))
            return (
              <Card key={c.id} className={c.is_completed ? 'border-success/40' : ''}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold">{c.title}</p>
                      <Badge variant="outline" className="mt-1 capitalize">
                        {c.period}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500 font-semibold text-sm">
                      <Zap className="size-4" /> {c.reward_xp}
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                    <span>
                      {c.current_value}/{c.target_value}
                    </span>
                    <span>{format(parseISO(c.end_date), 'MMM d')}</span>
                  </div>
                  <Progress value={pct} max={100} colorClass={c.is_completed ? 'bg-success' : 'gradient-secondary'} />
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState icon={Target} title="No challenges yet" description="Create daily, weekly, or monthly challenges to stay motivated." actionLabel="Create Challenge" onAction={() => setOpen(true)} />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Challenge</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-3">
            <Input placeholder="Challenge title (e.g. Gym 5 Days)" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            <div className="grid grid-cols-2 gap-2">
              <Select value={form.period} onChange={(e) => setForm((f) => ({ ...f, period: e.target.value as ChallengePeriod }))}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </Select>
              <Select value={form.metric} onChange={(e) => setForm((f) => ({ ...f, metric: e.target.value as ChallengeMetric }))}>
                <option value="gym_days">Gym Days</option>
                <option value="steps_total">Total Steps</option>
                <option value="water_daily_goal">Water Goal Days</option>
                <option value="weight_loss_kg">Weight Loss (kg)</option>
                <option value="run_distance_km">Run Distance (km)</option>
                <option value="cardio_sessions">Cardio Sessions</option>
                <option value="custom">Custom</option>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="Target value" value={form.target} onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))} />
              <Input type="number" placeholder="Reward XP" value={form.rewardXp} onChange={(e) => setForm((f) => ({ ...f, rewardXp: e.target.value }))} />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="gradient" onClick={handleCreate} disabled={!form.title.trim() || !form.target}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
