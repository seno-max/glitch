import { useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Clock, Dumbbell, Flame, Footprints, Droplets, TrendingUp, Trophy } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ShimmerSkeleton } from '@/components/ui/skeleton'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from 'recharts'
import { useAnalyticsSummary, usePersonalRecords } from '@/hooks/use-analytics'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

const PR_ICONS: Record<string, string> = {
  highest_weight: '🏋️',
  longest_workout: '⏱️',
  fastest_run: '🏃',
  longest_run: '🛣️',
  longest_cardio_session: '🚴',
  most_steps: '👣',
  longest_gym_streak: '🔥',
  most_water: '💧',
  lowest_weight: '⚖️',
  highest_workout_volume: '💪',
}

export default function AnalyticsPage() {
  const [range, setRange] = useState<'7' | '30' | '90'>('30')
  const { data, isLoading } = useAnalyticsSummary(Number(range))
  const { data: records } = usePersonalRecords()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="size-6 text-primary" /> Analytics
        </h1>
        <Tabs value={range} onValueChange={(v) => setRange(v as typeof range)}>
          <TabsList>
            <TabsTrigger value="7">7D</TabsTrigger>
            <TabsTrigger value="30">30D</TabsTrigger>
            <TabsTrigger value="90">90D</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading || !data ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ShimmerSkeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Metric icon={Dumbbell} label="Workout Hours" value={`${data.workoutHours}h`} gradient="gradient-primary" />
            <Metric icon={TrendingUp} label="Strength Volume" value={`${data.strengthVolumeKg.toLocaleString()}kg`} gradient="gradient-secondary" />
            <Metric icon={Clock} label="Cardio Hours" value={`${data.cardioHours}h`} gradient="gradient-accent" />
            <Metric icon={Footprints} label="Cardio Distance" value={`${data.cardioDistanceKm}km`} gradient="gradient-fire" />
            <Metric icon={Clock} label="Avg Workout" value={`${data.avgWorkoutMinutes}min`} gradient="gradient-primary" />
            <Metric icon={Footprints} label="Avg Steps" value={data.avgSteps.toLocaleString()} gradient="gradient-secondary" />
            <Metric icon={Droplets} label="Avg Water" value={`${(data.avgWaterMl / 1000).toFixed(1)}L`} gradient="gradient-accent" />
            <Metric icon={Flame} label="Food Logged" value={`${data.foodLoggingRatePct}%`} gradient="gradient-fire" />
          </div>

          {/* Weekly comparison bar chart */}
          {data.weeklyComparison.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Weekly Comparison</CardTitle>
              </CardHeader>
              <CardContent className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.weeklyComparison.map((w) => ({ week: format(parseISO(w.weekStart), 'MMM d'), workouts: w.workouts, minutes: w.minutes }))}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none' }} />
                    <Bar dataKey="workouts" name="Workouts" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Weight Trend</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                {data.weightTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.weightTrend.map((w) => ({ date: format(parseISO(w.date), 'MMM d'), weight: w.weight }))}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 12 }} domain={['dataMin - 2', 'dataMax + 2']} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: 'none' }} />
                      <Line type="monotone" dataKey="weight" stroke="#8b5cf6" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart label="No weight logs yet" />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Points Earned Trend</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                {data.pointsTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.pointsTrend.map((s) => ({ date: format(parseISO(s.date), 'MMM d'), points: s.points }))}>
                      <defs>
                        <linearGradient id="pointsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: 'none' }} />
                      <Area type="monotone" dataKey="points" stroke="#10b981" strokeWidth={3} fill="url(#pointsGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart label="No points earned yet" />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Steps Trend</CardTitle>
              </CardHeader>
              <CardContent className="h-56">
                {data.stepsTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.stepsTrend.map((s) => ({ date: format(parseISO(s.date), 'MMM d'), steps: s.steps }))}>
                      <defs>
                        <linearGradient id="stepsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#fb923c" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#fb923c" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: 'none' }} />
                      <Area type="monotone" dataKey="steps" stroke="#fb923c" strokeWidth={3} fill="url(#stepsGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart label="No steps logged yet" />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Water Trend</CardTitle>
              </CardHeader>
              <CardContent className="h-56">
                {data.waterTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.waterTrend.map((s) => ({ date: format(parseISO(s.date), 'MMM d'), L: Math.round((s.ml / 1000) * 10) / 10 }))}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 12 }} unit="L" />
                      <Tooltip contentStyle={{ borderRadius: 12, border: 'none' }} />
                      <Bar dataKey="L" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart label="No water logged yet" />
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Consistency Heatmap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {data.workoutHeatmap.map((day) => (
                  <motion.div
                    key={day.date}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    title={`${day.date}: ${day.count} workout(s)`}
                    className="h-6 w-6 rounded-md"
                    style={{ backgroundColor: `rgba(16, 185, 129, ${Math.min(1, 0.25 + day.count * 0.25)})` }}
                  />
                ))}
                {data.workoutHeatmap.length === 0 && <p className="text-sm text-muted-foreground py-4">No workout activity in this range yet.</p>}
              </div>
            </CardContent>
          </Card>

          {records && records.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="size-4 text-amber-500" /> Personal Best Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative pl-6 space-y-4 before:absolute before:left-[9px] before:top-1 before:bottom-1 before:w-0.5 before:bg-border">
                  {records.slice(0, 8).map((r, i) => (
                    <motion.div key={r.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="relative">
                      <div className="absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full gradient-fire text-[10px]">
                        {PR_ICONS[r.category] ?? '🏆'}
                      </div>
                      <p className="text-sm font-semibold">
                        {r.value} {r.unit} <span className="text-muted-foreground font-normal">— {r.category.replace(/_/g, ' ')}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(r.achieved_date), 'MMM d, yyyy')}
                        {r.context ? ` · ${r.context}` : ''}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Weekly Points</p>
                <p className="text-xl font-bold">{data.weeklyPoints}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Monthly Points</p>
                <p className="text-xl font-bold">{data.monthlyPoints}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Most Active Day</p>
                <p className="text-xl font-bold">{data.mostActiveDay ? format(parseISO(data.mostActiveDay), 'MMM d') : '—'}</p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

function Metric({ icon: Icon, label, value, gradient }: { icon: typeof Dumbbell; label: string; value: string; gradient: string }) {
  return (
    <Card className="card-hover">
      <CardContent className="p-4">
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl mb-2', gradient)}>
          <Icon className="size-4 text-white" />
        </div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold">{value}</p>
      </CardContent>
    </Card>
  )
}

function EmptyChart({ label }: { label: string }) {
  return <div className="h-full flex items-center justify-center text-sm text-muted-foreground">{label}</div>
}
