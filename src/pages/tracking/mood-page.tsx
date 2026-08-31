import { Smile } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMoodHistory, useLogMood } from '@/hooks/use-tracking'
import { todayStr } from '@/utils/date'
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
  const { data: history } = useMoodHistory(30)
  const logMood = useLogMood()

  const todayMood = history?.find((h) => h.date === todayStr())

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Smile className="size-6 text-amber-500" /> Mood Tracker
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>How are you feeling today?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2">
            {MOODS.map((mood) => (
              <motion.button
                key={mood.type}
                whileTap={{ scale: 0.92 }}
                onClick={() =>
                  logMood.mutate({ date: todayStr(), mood: mood.type, energy_level: null, notes: null })
                }
                className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3 transition-all ${
                  todayMood?.mood === mood.type ? `${mood.color} border-current` : 'border-border hover:border-primary/30'
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
