import { useState } from 'react'
import { Moon, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useSleepHistory, useLogSleep } from '@/hooks/use-tracking'
import { trackingService } from '@/services/tracking.service'
import { useQueryClient } from '@tanstack/react-query'
import { todayStr } from '@/utils/date'
import { format, parseISO } from 'date-fns'
import type { SleepQuality } from '@/types/database.types'
import { EmptyState } from '@/components/shared/empty-state'
import toast from 'react-hot-toast'

const QUALITY_EMOJI: Record<SleepQuality, string> = {
  excellent: '😴',
  good: '🙂',
  average: '😐',
  poor: '😕',
  very_poor: '😫',
}

export default function SleepPage() {
  const { data: history } = useSleepHistory(60)
  const logSleep = useLogSleep()
  const queryClient = useQueryClient()

  const [date, setDate] = useState(todayStr())
  const [sleepTime, setSleepTime] = useState('23:00')
  const [wakeTime, setWakeTime] = useState('07:00')
  const [quality, setQuality] = useState<SleepQuality>('good')

  const sorted = (history ?? []).slice().sort((a, b) => (a.date < b.date ? -1 : 1))
  const avgSleep = sorted.length ? sorted.reduce((s, d) => s + (d.hours_slept ?? 0), 0) / sorted.length : 0

  const chartData = sorted.map((d) => ({ date: format(parseISO(d.date), 'MMM d'), hours: d.hours_slept ?? 0 }))

  const handleLog = async () => {
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

  const handleDelete = async (id: string) => {
    await trackingService.deleteSleepLog(id)
    queryClient.invalidateQueries({ queryKey: ['sleep-history'] })
    toast.success('Sleep entry deleted')
  }

  const recent = sorted.slice().reverse().slice(0, 14)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Moon className="size-6 text-secondary" /> Sleep Tracker
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Log Sleep</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <Label className="text-xs">Date</Label>
            <Input type="date" max={todayStr()} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Sleep Time</Label>
            <Input type="time" value={sleepTime} onChange={(e) => setSleepTime(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Wake Time</Label>
            <Input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Quality</Label>
            <Select value={quality} onChange={(e) => setQuality(e.target.value as SleepQuality)}>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="average">Average</option>
              <option value="poor">Poor</option>
              <option value="very_poor">Very Poor</option>
            </Select>
          </div>
          <Button variant="gradient" className="col-span-2 sm:col-span-4" onClick={handleLog} disabled={logSleep.isPending}>
            Save Sleep Log
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Average (last {sorted.length} logs)</p>
          <p className="text-2xl font-bold">{avgSleep.toFixed(1)}h</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sleep Trend</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {chartData.length === 0 ? (
            <EmptyState icon={Moon} title="No sleep logs yet" description="Log your sleep to start seeing your trend." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
                <YAxis tick={{ fontSize: 12 }} unit="h" />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none' }} />
                <Bar dataKey="hours" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Sleep Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <EmptyState icon={Moon} title="No logs yet" />
          ) : (
            <div className="space-y-1">
              {recent.map((log) => (
                <div key={log.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    <span>{log.quality ? QUALITY_EMOJI[log.quality] : '🛏️'}</span>
                    <div>
                      <p className="text-sm font-medium">{format(parseISO(log.date), 'MMM d, yyyy')}</p>
                      <p className="text-xs text-muted-foreground capitalize">{log.quality?.replace('_', ' ') ?? '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold">{log.hours_slept?.toFixed(1) ?? '—'}h</p>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(log.id)}
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
