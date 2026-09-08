import { motion } from 'framer-motion'
import { Trophy, Clock, Dumbbell, ArrowRight } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { formatDurationHM } from '@/utils/date'

export interface WorkoutSummaryData {
  durationMinutes: number
  exerciseCount: number
  workoutTypes: string[]
}

/**
 * A short celebratory summary shown right after finishing/saving a
 * workout — duration, exercise count, and workout types at a glance,
 * before returning to the calendar/day view.
 */
export function WorkoutSummaryModal({
  data,
  open,
  onClose,
}: {
  data: WorkoutSummaryData | null
  open: boolean
  onClose: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full gradient-primary shadow-glow"
          >
            <Trophy className="size-8 text-white" />
          </motion.div>
          <DialogTitle className="text-center">Workout Complete!</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="rounded-xl bg-muted/50 p-4 text-center">
              <Clock className="size-5 mx-auto mb-1.5 text-emerald-500" />
              <p className="text-xl font-bold">{data ? formatDurationHM(data.durationMinutes) : '—'}</p>
              <p className="text-xs text-muted-foreground">Duration</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-4 text-center">
              <Dumbbell className="size-5 mx-auto mb-1.5 text-violet-500" />
              <p className="text-xl font-bold">{data?.exerciseCount ?? 0}</p>
              <p className="text-xs text-muted-foreground">Exercises</p>
            </div>
          </div>
          {data && data.workoutTypes.length > 0 && (
            <p className="text-center text-sm text-muted-foreground mt-4">{data.workoutTypes.join(', ').replace(/_/g, ' ')}</p>
          )}
        </DialogBody>
        <DialogFooter className="justify-center">
          <Button variant="gradient" onClick={onClose} className="w-full">
            Nice! <ArrowRight className="size-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
