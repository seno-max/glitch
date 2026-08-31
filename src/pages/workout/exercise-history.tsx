import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, TrendingUp } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { useExerciseHistory } from '@/hooks/use-workout'
import { format, parseISO } from 'date-fns'

export default function ExerciseHistoryPage() {
  const { name } = useParams<{ name: string }>()
  const navigate = useNavigate()
  const exerciseName = decodeURIComponent(name ?? '')
  const { data, isLoading } = useExerciseHistory(exerciseName)

  const chartData = (data ?? []).map((ex) => ({
    date: format(parseISO(ex.performed_at), 'MMM d'),
    weight: ex.weight_kg,
    volume: ex.volume_kg ?? 0,
  }))

  const maxWeight = data && data.length ? Math.max(...data.map((d) => d.weight_kg)) : 0
  const maxVolume = data && data.length ? Math.max(...data.map((d) => d.volume_kg ?? 0)) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon-sm" onClick={() => navigate('/workout/exercises')}>
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-xl font-bold">{exerciseName}</h1>
      </div>

      {isLoading ? (
        <Skeleton className="h-72 rounded-2xl" />
      ) : !data || data.length === 0 ? (
        <EmptyState icon={TrendingUp} title="No history yet" description="Log this exercise in a workout to see progression here." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Best Weight</p>
                <p className="text-2xl font-bold text-primary">{maxWeight} kg</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Best Volume</p>
                <p className="text-2xl font-bold text-primary">{maxVolume.toLocaleString()} kg</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Weight Progression</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none' }} />
                  <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} name="Weight (kg)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Volume Progression</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none' }} />
                  <Line type="monotone" dataKey="volume" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} name="Volume (kg)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Session Log</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data
                .slice()
                .reverse()
                .map((ex) => (
                  <div key={ex.id} className="flex justify-between text-sm py-2 border-b border-border last:border-0">
                    <span className="text-muted-foreground">{format(parseISO(ex.performed_at), 'MMM d, yyyy')}</span>
                    <span className="font-medium">
                      {ex.weight_kg}kg × {ex.sets} × {ex.reps}
                    </span>
                  </div>
                ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
