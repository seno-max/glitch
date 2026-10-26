import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Droplets, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CircularProgress } from '@/components/ui/circular-progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { useWaterLogsForDate, useAddWater, useWaterHistory, useSettings } from '@/hooks/use-tracking'
import { useSingleFlight } from '@/hooks/use-single-flight'
import { todayStr, earliestEditableDate, isWithinEditWindow } from '@/utils/date'
import { format, parseISO } from 'date-fns'

const QUICK_AMOUNTS = [250, 500, 750, 1000]

export default function WaterPage() {
  const [searchParams] = useSearchParams()
  const [date, setDate] = useState(searchParams.get('date') ?? todayStr())
  const { data: logs, isLoading } = useWaterLogsForDate(date)
  const { data: settings } = useSettings()
  const { data: history } = useWaterHistory(7)
  const addWater = useAddWater()

  const editable = isWithinEditWindow(date)
  const goal = settings?.water_goal_ml ?? 3000
  const total = (logs ?? []).reduce((s, l) => s + l.amount_ml, 0)

  const [handleAddWater, addingWater] = useSingleFlight(async (amount: number) => {
    await addWater.mutateAsync({ date, amountMl: amount })
  })

  const chartData = (history ?? []).reduce<Record<string, number>>((acc, l) => {
    acc[l.date] = (acc[l.date] ?? 0) + l.amount_ml
    return acc
  }, {})
  const chartArray = Object.entries(chartData).map(([d, ml]) => ({ date: format(parseISO(d), 'EEE'), ml: ml / 1000 }))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Droplets className="size-6 text-blue-500" /> Water Tracker
      </h1>

      <Card className="overflow-hidden">
        <CardContent className="p-6 flex flex-col items-center gap-6">
          <div className="w-full max-w-xs">
            <Label className="text-xs">Date</Label>
            <Input type="date" min={earliestEditableDate()} max={todayStr()} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <CircularProgress value={total} max={goal} size={180} strokeWidth={14} colorFrom="#38bdf8" colorTo="#0ea5e9">
            <div className="text-center">
              <p className="text-3xl font-bold">{(total / 1000).toFixed(2)}L</p>
              <p className="text-xs text-muted-foreground">of {(goal / 1000).toFixed(1)}L goal</p>
            </div>
          </CircularProgress>

          <div className="grid grid-cols-4 gap-2 w-full">
            {QUICK_AMOUNTS.map((amount) => (
              <motion.button
                key={amount}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAddWater(amount)}
                disabled={!editable || addWater.isPending || addingWater}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-border p-3 hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                <Plus className="size-4 text-blue-500" />
                <span className="text-sm font-semibold">{amount}ml</span>
              </motion.button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{date === todayStr() ? "Today's Log" : 'Log for this Day'}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : logs && logs.length > 0 ? (
            <div className="space-y-1.5">
              {logs.map((log) => (
                <div key={log.id} className="flex justify-between text-sm py-1.5 border-b border-border last:border-0">
                  <span className="text-muted-foreground">{format(parseISO(log.logged_at), 'h:mm a')}</span>
                  <span className="font-medium">{log.amount_ml}ml</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">No water logged yet for this day.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Last 7 Days</CardTitle>
        </CardHeader>
        <CardContent className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartArray}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} unit="L" />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none' }} />
              <ReferenceLine y={goal / 1000} stroke="#0ea5e9" strokeDasharray="4 4" />
              <Bar dataKey="ml" fill="#38bdf8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
