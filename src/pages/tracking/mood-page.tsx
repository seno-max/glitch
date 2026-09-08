import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Smile } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useMoodHistory, useLogMood } from '@/hooks/use-tracking'
import { todayStr, earliestEditableDate, isWithinEditWindow } from '@/utils/date'
import { format, parseISO } from 'date-fns'
import type { MoodType } from '@/types/database.types'
import { motion } from 'framer-motion'

const MOODS: { type: MoodType; emoji: string; label: string; color: string }[] = [
  { type: 'excellent', emoji: '😀', label: 'Excellent', color: 'bg-emerald-500/10 border-emerald-500/30' },
  { type: 'good', emoji: '🙂', label: 'Good', color: 'bg-lime-500/10 border-lime-500/30' },
  { type: 'average', emoji: '😐', label: 'Average', color: 'bg-amber-500/10 border-amber-500/30' },
  { type: 'bad', emoji: '😞', label: 'Bad', color: 'bg-orange-500/10 border-orange-500/30' },
  { type: 'very_bad', emoji: '😫', label: 'Very Bad', color: 'bg-red-500/10 border-red-500/30' },
]

export default function MoodPage() {
  const [searchParams] = useSearchParams()
  const [date, setDate] = useState(searchParams.get('date') ?? todayStr())
  const { data: history } = useMoodHistory(30)
  const logMood = useLogMood()

  const editable = isWithinEditWindow(date)
  const dayMood = history?.find((h) => h.date === date)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Smile className="size-6 text-amber-500" /> Mood Tracker
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>{date === todayStr() ? 'How are you feeling today?' : 'How were you feeling that day?'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-xs">
            <Label className="text-xs">Date</Label>
            <Input type="date" min={earliestEditableDate()} max={todayStr()} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="grid grid-cols-5 gap-2">
            {MOODS.map((mood) => (
              <motion.button
                key={mood.type}
                whileTap={{ scale: 0.92 }}
                disabled={!editable}
                onClick={() => logMood.mutate({ date, mood: mood.type, energy_level: null, notes: null })}
                className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3 transition-all disabled:opacity-50 disabled:pointer-events-none ${
                  dayMood?.mood === mood.type ? `${mood.color} border-current` : 'border-border hover:border-primary/30'
                }`}
              >
                <span className="text-3xl">{mood.emoji}</span>
                <span className="text-[10px] font-medium text-center">{mood.label}</span>
              </motion.button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mood History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {history && history.length > 0 ? (
            history
              .slice()
              .reverse()
              .map((h) => {
                const moodInfo = MOODS.find((m) => m.type === h.mood)
                return (
                  <div key={h.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-sm text-muted-foreground">{format(parseISO(h.date), 'EEE, MMM d')}</span>
                    <span className="flex items-center gap-2 text-sm font-medium">
                      {moodInfo?.emoji} {moodInfo?.label}
                    </span>
                  </div>
                )
              })
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">No mood logs yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
