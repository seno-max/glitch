import { useState } from 'react'
import { Scale, TrendingDown, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useWeightHistory, useLogWeight } from '@/hooks/use-tracking'
import { useAuthStore } from '@/stores/auth.store'
import { todayStr } from '@/utils/date'
import { format, parseISO, subDays } from 'date-fns'

export default function WeightPage() {
  const { profile } = useAuthStore()
  const { data: history, isLoading } = useWeightHistory(365)
  const logWeight = useLogWeight()
  const [range, setRange] = useState<'week' | 'month' | 'year'>('month')

  const [form, setForm] = useState({
    weight: '',
    bodyFat: '',
    muscle: '',
    visceralFat: '',
    bodyWater: '',
    notes: '',
  })

  const days = range === 'week' ? 7 : range === 'month' ? 30 : 365
  const filtered = (history ?? []).filter((h) => parseISO(h.date) >= subDays(new Date(), days))
  const chartData = filtered.map((h) => ({ date: format(parseISO(h.date), days > 60 ? 'MMM' : 'MMM d'), weight: h.weight_kg }))

  const latest = history && history.length > 0 ? history[history.length - 1] : null
  const first = history && history.length > 0 ? history[0] : null
  const totalChange = latest && first ? Math.round((latest.weight_kg - first.weight_kg) * 10) / 10 : null
  const goalWeight = profile?.goal_weight_kg

  const bmi = () => {
    const w = Number(form.weight) || latest?.weight_kg
    if (!w || !profile?.height_cm) return null
    const hM = profile.height_cm / 100
    return Math.round((w / (hM * hM)) * 10) / 10
  }

  const handleLog = async () => {
    if (!form.weight) return
    await logWeight.mutateAsync({
      date: todayStr(),
      weight_kg: Number(form.weight),
      body_fat_pct: form.bodyFat ? Number(form.bodyFat) : null,
      bmi: bmi(),
      muscle_pct: form.muscle ? Number(form.muscle) : null,
      visceral_fat: form.visceralFat ? Number(form.visceralFat) : null,
      body_water_pct: form.bodyWater ? Number(form.bodyWater) : null,
      notes: form.notes || null,
    })
    setForm({ weight: '', bodyFat: '', muscle: '', visceralFat: '', bodyWater: '', notes: '' })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Scale className="size-6 text-secondary" /> Weight Tracker
      </h1>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Current</p>
            <p className="text-xl font-bold">{latest?.weight_kg ?? '—'} kg</p>
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
          <CardTitle>Log Today's Weight</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Input type="number" step="0.1" placeholder="Weight (kg) *" value={form.weight} onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))} />
          <Input type="number" step="0.1" placeholder="Body Fat %" value={form.bodyFat} onChange={(e) => setForm((f) => ({ ...f, bodyFat: e.target.value }))} />
          <Input type="number" step="0.1" placeholder="Muscle %" value={form.muscle} onChange={(e) => setForm((f) => ({ ...f, muscle: e.target.value }))} />
          <Input type="number" step="0.1" placeholder="Visceral Fat" value={form.visceralFat} onChange={(e) => setForm((f) => ({ ...f, visceralFat: e.target.value }))} />
          <Input type="number" step="0.1" placeholder="Body Water %" value={form.bodyWater} onChange={(e) => setForm((f) => ({ ...f, bodyWater: e.target.value }))} />
          <Input placeholder="Notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          <Button variant="gradient" className="col-span-2 sm:col-span-3" onClick={handleLog} disabled={!form.weight || logWeight.isPending}>
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
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="h-64">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
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
    </div>
  )
}
