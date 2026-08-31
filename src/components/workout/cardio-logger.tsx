import { motion } from 'framer-motion'
import { Plus, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useActiveWorkoutStore } from '@/stores/active-workout.store'
import type { CardioMachineType, OutdoorActivityType, CardioMode } from '@/types/database.types'

const MACHINE_TYPES: CardioMachineType[] = [
  'treadmill',
  'elliptical',
  'cross_trainer',
  'stationary_bike',
  'spin_bike',
  'rowing_machine',
  'stair_climber',
  'air_bike',
  'ski_erg',
  'arc_trainer',
]
const OUTDOOR_TYPES: OutdoorActivityType[] = ['walking', 'running', 'jogging', 'cycling', 'swimming', 'hiking']

export function CardioLogger() {
  const { draftCardio, addCardioSession, updateCardioSession, removeCardioSession } = useActiveWorkoutStore()

  const addSession = (mode: CardioMode) => {
    addCardioSession({
      tempId: crypto.randomUUID(),
      mode,
      machine_type: mode === 'machine' ? 'treadmill' : null,
      outdoor_type: mode === 'outdoor' ? 'running' : null,
      duration_minutes: 20,
      order_index: draftCardio.length,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cardio Sessions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {draftCardio.map((session) => (
          <motion.div
            key={session.tempId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <Select
                value={session.mode}
                onChange={(e) => updateCardioSession(session.tempId, { mode: e.target.value as CardioMode })}
                className="max-w-[140px]"
              >
                <option value="machine">Machine</option>
                <option value="outdoor">Outdoor</option>
              </Select>
              <button onClick={() => removeCardioSession(session.tempId)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="size-4" />
              </button>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Type</label>
              {session.mode === 'machine' ? (
                <Select
                  value={session.machine_type ?? 'treadmill'}
                  onChange={(e) => updateCardioSession(session.tempId, { machine_type: e.target.value as CardioMachineType })}
                >
                  {MACHINE_TYPES.map((m) => (
                    <option key={m} value={m}>
                      {m.replace(/_/g, ' ')}
                    </option>
                  ))}
                </Select>
              ) : (
                <Select
                  value={session.outdoor_type ?? 'running'}
                  onChange={(e) => updateCardioSession(session.tempId, { outdoor_type: e.target.value as OutdoorActivityType })}
                >
                  {OUTDOOR_TYPES.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </Select>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Duration (min)</label>
                <Input
                  type="number"
                  value={session.duration_minutes ?? 0}
                  onChange={(e) => updateCardioSession(session.tempId, { duration_minutes: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Distance (km)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={session.distance_km ?? ''}
                  onChange={(e) => updateCardioSession(session.tempId, { distance_km: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Avg Speed (km/h)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={session.avg_speed_kmh ?? ''}
                  onChange={(e) => updateCardioSession(session.tempId, { avg_speed_kmh: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Max Speed (km/h)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={session.max_speed_kmh ?? ''}
                  onChange={(e) => updateCardioSession(session.tempId, { max_speed_kmh: Number(e.target.value) })}
                />
              </div>
              {session.mode === 'machine' && (
                <>
                  <div>
                    <label className="text-xs text-muted-foreground">Resistance</label>
                    <Input
                      type="number"
                      value={session.resistance_level ?? ''}
                      onChange={(e) => updateCardioSession(session.tempId, { resistance_level: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Incline (%)</label>
                    <Input
                      type="number"
                      step="0.5"
                      value={session.incline ?? ''}
                      onChange={(e) => updateCardioSession(session.tempId, { incline: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">RPM</label>
                    <Input
                      type="number"
                      value={session.rpm ?? ''}
                      onChange={(e) => updateCardioSession(session.tempId, { rpm: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Steps</label>
                    <Input
                      type="number"
                      value={session.steps ?? ''}
                      onChange={(e) => updateCardioSession(session.tempId, { steps: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Floors Climbed</label>
                    <Input
                      type="number"
                      value={session.floors_climbed ?? ''}
                      onChange={(e) => updateCardioSession(session.tempId, { floors_climbed: Number(e.target.value) })}
                    />
                  </div>
                </>
              )}
              <div>
                <label className="text-xs text-muted-foreground">Calories</label>
                <Input
                  type="number"
                  value={session.calories_burned ?? ''}
                  onChange={(e) => updateCardioSession(session.tempId, { calories_burned: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Avg Heart Rate</label>
                <Input
                  type="number"
                  value={session.avg_heart_rate ?? ''}
                  onChange={(e) => updateCardioSession(session.tempId, { avg_heart_rate: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Max Heart Rate</label>
                <Input
                  type="number"
                  value={session.max_heart_rate ?? ''}
                  onChange={(e) => updateCardioSession(session.tempId, { max_heart_rate: Number(e.target.value) })}
                />
              </div>
            </div>
            <Input
              placeholder="Notes (optional)"
              value={session.notes ?? ''}
              onChange={(e) => updateCardioSession(session.tempId, { notes: e.target.value })}
            />
          </motion.div>
        ))}

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => addSession('machine')}>
            <Plus className="size-4" /> Machine Cardio
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => addSession('outdoor')}>
            <Plus className="size-4" /> Outdoor Cardio
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
