import { useState } from 'react'
import { Footprints } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useStepsToday, useStepsHistory, useLogSteps, useSettings } from '@/hooks/use-tracking'
import { format, parseISO } from 'date-fns'

export default function StepsPage() {
  const { data: today } = useStepsToday()
  const { data: settings } = useSettings()
  const { data: history } = useStepsHistory(30)
  const logSteps = useLogSteps()
  const [input, setInput] = useState('')

  const goal = settings?.step_goal ?? 10000
  const current = today?.steps ?? 0

  const weekData = (history ?? []).slice(-7)
  const avgWeek = weekData.length ? Math.round(weekData.reduce((s, d) => s + d.steps, 0) / weekData.length) : 0
  const avgMonth = history && history.length ? Math.round(history.reduce((s, d) => s + d.steps, 0) / history.length) : 0
  const bestDay = history && history.length ? history.reduce((max, d) => (d.steps > max.steps ? d : max)) : null

  const chartData = (history ?? []).map((d) => ({ date: format(parseISO(d.date), 'MMM d'), steps: d.steps }))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Footprints className="size-6 text-orange-500" /> Step Tracker
      </h1>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-3xl font-bold">{current.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">/ {goal.toLocaleString()} steps</p>
          </div>
          <Progress value={current} max={goal} colorClass="bg-gradient-to-r from-orange-400 to-pink-500" />
          <div className="flex gap-2 mt-4">
            <Input type="number" placeholder="Enter today's steps" value={input} onChange={(e) => setInput(e.target.value)} />
            <Button variant="gradient" onClick={() => input && logSteps.mutate(Number(input))} disabled={!input || logSteps.isPending}>
              Log
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Weekly Avg</p>
            <p className="text-xl font-bold">{avgWeek.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Monthly Avg</p>
            <p className="text-xl font-bold">{avgMonth.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Best Day</p>
            <p className="text-xl font-bold">{bestDay?.steps.toLocaleString() ?? '—'}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Last 30 Days</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none' }} />
              <Bar dataKey="steps" fill="#fb923c" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
