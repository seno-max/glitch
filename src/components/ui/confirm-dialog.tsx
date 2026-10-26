import { useRef, useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

/**
 * Simple reusable "are you sure?" confirmation dialog. Used anywhere a
 * destructive action (delete) needs an explicit confirm step instead of a
 * swipe gesture or an instant, un-confirmed click.
 *
 * Guards against double-tapping the confirm button itself: `onConfirm` may
 * be async, and a synchronous ref-based lock (not just React state, which
 * only takes effect after a render) ignores a second tap that lands before
 * the first call finishes -- otherwise a fast double-tap on "Delete" could
 * fire the delete/save action twice.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  destructive = true,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void | Promise<void>
  destructive?: boolean
}) {
  const inFlight = useRef(false)
  const [pending, setPending] = useState(false)

  const handleConfirm = async () => {
    if (inFlight.current) return
    inFlight.current = true
    setPending(true)
    try {
      await onConfirm()
    } finally {
      inFlight.current = false
      setPending(false)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {destructive && <AlertTriangle className="size-5 text-destructive" />}
            {title}
          </DialogTitle>
        </DialogHeader>
        {description && (
          <DialogBody>
            <p className="text-sm text-muted-foreground">{description}</p>
          </DialogBody>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            {cancelLabel}
          </Button>
          <Button variant={destructive ? 'destructive' : 'gradient'} onClick={handleConfirm} disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
