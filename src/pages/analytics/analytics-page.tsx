import { useState } from 'react'
import { BarChart3, Clock, Dumbbell, Flame, Footprints, Droplets, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { useAnalyticsSummary } from '@/hooks/use-analytics'
import { format, parseISO } from 'date-fns'

export default function AnalyticsPage() {
  const [range, setRange] = useState<'7' | '30' | '90'>('30')
  const { data, isLoading } = useAnalyticsSummary(Number(range))

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
            <Skeleton key={i} className="h-24 rounded-2xl" />
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

          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Weight Trend</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.weightTrend.map((w) => ({ date: format(parseISO(w.date), 'MMM d'), weight: w.weight }))}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} domain={['dataMin - 2', 'dataMax + 2']} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none' }} />
                    <Line type="monotone" dataKey="weight" stroke="#8b5cf6" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Points Earned Trend</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
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
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Workout Heatmap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {data.workoutHeatmap.map((day) => (
                  <div
                    key={day.date}
                    title={`${day.date}: ${day.count} workout(s)`}
                    className="h-6 w-6 rounded-md"
                    style={{ backgroundColor: `rgba(16, 185, 129, ${Math.min(1, 0.25 + day.count * 0.25)})` }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

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
    <Card>
      <CardContent className="p-4">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${gradient} mb-2`}>
          <Icon className="size-4 text-white" />
        </div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold">{value}</p>
      </CardContent>
    </Card>
  )
}
