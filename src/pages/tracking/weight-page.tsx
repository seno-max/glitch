import { useState } from 'react'
import { Scale, TrendingDown, TrendingUp, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useWeightHistory, useLogWeight, useDeleteWeightLog } from '@/hooks/use-tracking'
import { useAuthStore } from '@/stores/auth.store'
import { todayStr } from '@/utils/date'
import { format, parseISO, subDays } from 'date-fns'
import { EmptyState } from '@/components/shared/empty-state'

export default function WeightPage() {
  const { profile } = useAuthStore()
  const { data: history, isLoading } = useWeightHistory(3650)
  const logWeight = useLogWeight()
  const deleteWeight = useDeleteWeightLog()
  const [range, setRange] = useState<'week' | 'month' | 'year' | 'all'>('month')

  const [form, setForm] = useState({
    date: todayStr(),
    weight: '',
    bodyFat: '',
    muscle: '',
    visceralFat: '',
    bodyWater: '',
    notes: '',
  })

  const days = range === 'week' ? 7 : range === 'month' ? 30 : range === 'year' ? 365 : 3650
  const filtered = (history ?? []).filter((h) => parseISO(h.date) >= subDays(new Date(), days))
  const chartData = filtered.map((h) => ({ date: format(parseISO(h.date), days > 60 ? 'MMM' : 'MMM d'), weight: h.weight_kg }))

  // "Current" = most recent log by date, regardless of gaps — the user logs
  // whenever they choose, not on a fixed schedule.
  const sortedByDate = (history ?? []).slice().sort((a, b) => (a.date < b.date ? -1 : 1))
  const latest = sortedByDate.length > 0 ? sortedByDate[sortedByDate.length - 1] : null
  const first = sortedByDate.length > 0 ? sortedByDate[0] : null
  const totalChange = latest && first ? Math.round((latest.weight_kg - first.weight_kg) * 10) / 10 : null
  const goalWeight = profile?.goal_weight_kg

  const bmi = () => {
    const w = Number(form.weight) || latest?.weight_kg
    if (!w || !profile?.height_cm) return null
    const hM = profile.height_cm / 100
    return Math.round((w / (hM * hM)) * 10) / 10
  }

  const handleLog = async () => {
    if (!form.weight || !form.date) return
    await logWeight.mutateAsync({
      date: form.date,
      weight_kg: Number(form.weight),
      body_fat_pct: form.bodyFat ? Number(form.bodyFat) : null,
      bmi: bmi(),
      muscle_pct: form.muscle ? Number(form.muscle) : null,
      visceral_fat: form.visceralFat ? Number(form.visceralFat) : null,
      body_water_pct: form.bodyWater ? Number(form.bodyWater) : null,
      notes: form.notes || null,
    })
    setForm({ date: todayStr(), weight: '', bodyFat: '', muscle: '', visceralFat: '', bodyWater: '', notes: '' })
  }

  const recentEntries = sortedByDate.slice().reverse().slice(0, 15)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Scale className="size-6 text-secondary" /> Weight Tracker
      </h1>
      <p className="text-sm text-muted-foreground -mt-4">
        Log your weight whenever you check in — no daily requirement. Your most recent entry becomes your current weight.
      </p>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Current</p>
            <p className="text-xl font-bold">{latest?.weight_kg ?? '—'} kg</p>
            {latest && <p className="text-[11px] text-muted-foreground mt-0.5">{format(parseISO(latest.date), 'MMM d, yyyy')}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Goal</p>
            <p className="text-xl font-bold">{goalWeight ?? '—'} kg</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-1 text-muted-foreground">
              {totalChange !== null && totalChange <= 0 ? (
                <TrendingDown className="size-3.5 text-success" />
              ) : (
                <TrendingUp className="size-3.5 text-destructive" />
              )}
              <p className="text-xs">Total Change</p>
            </div>
            <p className="text-xl font-bold">{totalChange !== null ? `${totalChange > 0 ? '+' : ''}${totalChange} kg` : '—'}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Log a Weight Check-in</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Date</Label>
              <Input type="date" max={todayStr()} value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            </div>
            <Input type="number" step="0.1" placeholder="Weight (kg) *" value={form.weight} onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))} />
            <Input type="number" step="0.1" placeholder="Body Fat %" value={form.bodyFat} onChange={(e) => setForm((f) => ({ ...f, bodyFat: e.target.value }))} />
            <Input type="number" step="0.1" placeholder="Muscle %" value={form.muscle} onChange={(e) => setForm((f) => ({ ...f, muscle: e.target.value }))} />
            <Input type="number" step="0.1" placeholder="Visceral Fat" value={form.visceralFat} onChange={(e) => setForm((f) => ({ ...f, visceralFat: e.target.value }))} />
            <Input type="number" step="0.1" placeholder="Body Water %" value={form.bodyWater} onChange={(e) => setForm((f) => ({ ...f, bodyWater: e.target.value }))} />
            <Input placeholder="Notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="col-span-2" />
          </div>
          <Button variant="gradient" className="w-full" onClick={handleLog} disabled={!form.weight || !form.date || logWeight.isPending}>
            Save Entry
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Weight Trend</CardTitle>
          <Tabs value={range} onValueChange={(v) => setRange(v as typeof range)}>
            <TabsList>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="h-64">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : chartData.length === 0 ? (
            <EmptyState icon={Scale} title="No entries in this range" description="Log a weight check-in to see your trend." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none' }} />
                <Line type="monotone" dataKey="weight" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {recentEntries.length === 0 ? (
            <EmptyState icon={Scale} title="No entries yet" />
          ) : (
            <div className="space-y-1">
              {recentEntries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{format(parseISO(entry.date), 'MMM d, yyyy')}</p>
                    {entry.notes && <p className="text-xs text-muted-foreground">{entry.notes}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold">{entry.weight_kg} kg</p>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => deleteWeight.mutate(entry.id)}
                      disabled={deleteWeight.isPending}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
