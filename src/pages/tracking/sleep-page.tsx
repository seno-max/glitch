import { useState } from 'react'
import { Moon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { useSleepHistory, useLogSleep, useSettings } from '@/hooks/use-tracking'
import { todayStr } from '@/utils/date'
import { format, parseISO } from 'date-fns'
import type { SleepQuality } from '@/types/database.types'

export default function SleepPage() {
  const { data: history } = useSleepHistory(30)
  const { data: settings } = useSettings()
  const logSleep = useLogSleep()

  const [sleepTime, setSleepTime] = useState('23:00')
  const [wakeTime, setWakeTime] = useState('07:00')
  const [quality, setQuality] = useState<SleepQuality>('good')

  const goal = settings?.sleep_goal_hours ?? 8
  const avgSleep = history && history.length ? history.reduce((s, d) => s + (d.hours_slept ?? 0), 0) / history.length : 0

  const chartData = (history ?? []).map((d) => ({ date: format(parseISO(d.date), 'MMM d'), hours: d.hours_slept ?? 0 }))

  const handleLog = async () => {
    const date = todayStr()
    const sleepDateTime = new Date(`${date}T${sleepTime}:00`)
    let wakeDateTime = new Date(`${date}T${wakeTime}:00`)
    if (wakeDateTime <= sleepDateTime) wakeDateTime = new Date(wakeDateTime.getTime() + 24 * 60 * 60 * 1000)

    await logSleep.mutateAsync({
      date,
      sleep_time: sleepDateTime.toISOString(),
      wake_time: wakeDateTime.toISOString(),
      quality,
      notes: null,
    })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Moon className="size-6 text-secondary" /> Sleep Tracker
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Log Last Night's Sleep</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Sleep Time</label>
            <Input type="time" value={sleepTime} onChange={(e) => setSleepTime(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Wake Time</label>
            <Input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Quality</label>
            <Select value={quality} onChange={(e) => setQuality(e.target.value as SleepQuality)}>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="average">Average</option>
              <option value="poor">Poor</option>
              <option value="very_poor">Very Poor</option>
            </Select>
          </div>
          <Button variant="gradient" className="col-span-2 sm:col-span-3" onClick={handleLog} disabled={logSleep.isPending}>
            Save Sleep Log
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">30-Day Average</p>
          <p className="text-2xl font-bold">{avgSleep.toFixed(1)}h</p>
          <p className="text-xs text-muted-foreground mt-1">Goal: {goal}h/night</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sleep Trend</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
              <YAxis tick={{ fontSize: 12 }} unit="h" />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none' }} />
              <ReferenceLine y={goal} stroke="#8b5cf6" strokeDasharray="4 4" />
              <Bar dataKey="hours" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
