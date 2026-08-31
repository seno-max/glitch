import { useState } from 'react'
import { Ruler } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useMeasurementsHistory, useAddMeasurement } from '@/hooks/use-tracking'
import { todayStr } from '@/utils/date'
import { format, parseISO } from 'date-fns'

const FIELDS: { key: string; label: string }[] = [
  { key: 'neck_cm', label: 'Neck' },
  { key: 'shoulders_cm', label: 'Shoulders' },
  { key: 'chest_cm', label: 'Chest' },
  { key: 'waist_cm', label: 'Waist' },
  { key: 'hip_cm', label: 'Hip' },
  { key: 'left_arm_cm', label: 'Left Arm' },
  { key: 'right_arm_cm', label: 'Right Arm' },
  { key: 'left_forearm_cm', label: 'Left Forearm' },
  { key: 'right_forearm_cm', label: 'Right Forearm' },
  { key: 'left_thigh_cm', label: 'Left Thigh' },
  { key: 'right_thigh_cm', label: 'Right Thigh' },
  { key: 'left_calf_cm', label: 'Left Calf' },
  { key: 'right_calf_cm', label: 'Right Calf' },
]

export default function MeasurementsPage() {
  const { data: history } = useMeasurementsHistory(365)
  const addMeasurement = useAddMeasurement()
  const [form, setForm] = useState<Record<string, string>>({})

  const chartData = (history ?? []).map((h) => ({
    date: format(parseISO(h.date), 'MMM d'),
    waist: h.waist_cm,
    chest: h.chest_cm,
    hip: h.hip_cm,
  }))

  const handleSave = async () => {
    const payload: Record<string, number | null> = {}
    for (const f of FIELDS) payload[f.key] = form[f.key] ? Number(form[f.key]) : null
    await addMeasurement.mutateAsync({ date: todayStr(), notes: null, ...payload } as never)
    setForm({})
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Ruler className="size-6 text-primary" /> Body Measurements
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>New Measurement</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {FIELDS.map((f) => (
            <Input
              key={f.key}
              type="number"
              step="0.1"
              placeholder={`${f.label} (cm)`}
              value={form[f.key] ?? ''}
              onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
            />
          ))}
          <Button variant="gradient" className="col-span-2 sm:col-span-3" onClick={handleSave} disabled={addMeasurement.isPending}>
            Save Measurements
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comparison Chart</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none' }} />
              <Legend />
              <Line type="monotone" dataKey="waist" stroke="#ef4444" strokeWidth={2} name="Waist" />
              <Line type="monotone" dataKey="chest" stroke="#10b981" strokeWidth={2} name="Chest" />
              <Line type="monotone" dataKey="hip" stroke="#8b5cf6" strokeWidth={2} name="Hip" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
