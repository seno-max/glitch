import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { trackingService } from '@/services/tracking.service'
import { Badge } from '@/components/ui/badge'
import { isWithinEditWindow } from '@/utils/date'
import { format, parseISO } from 'date-fns'
import type { ProgressPhoto } from '@/types/database.types'

/**
 * Full-screen photo lightbox: tapping a thumbnail in the "All Photos" grid
 * opens the actual photo close-up here, with left/right navigation through
 * the rest of the gallery and a delete button (gated behind the same
 * confirmation dialog flow used everywhere else) instead of only ever
 * seeing tiny thumbnails with no way to view or manage the full-size photo.
 */
export function PhotoViewer({
  photos,
  index,
  onIndexChange,
  onClose,
  onRequestDelete,
}: {
  photos: ProgressPhoto[]
  index: number
  onIndexChange: (index: number) => void
  onClose: () => void
  onRequestDelete: (photo: ProgressPhoto) => void
}) {
  const open = index >= 0 && index < photos.length
  const photo = open ? photos[index] : null

  const { data: url } = useQuery({
    queryKey: ['photo-url', photo?.storage_path],
    queryFn: () => trackingService.getProgressPhotoUrl(photo!.storage_path),
    enabled: !!photo,
  })

  const goPrev = () => onIndexChange((index - 1 + photos.length) % photos.length)
  const goNext = () => onIndexChange((index + 1) % photos.length)

  // Keyboard support (desktop/web) — Escape closes, arrows navigate.
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, index, photos.length])

  return createPortal(
    <AnimatePresence>
      {open && photo && (
        <motion.div
          className="fixed inset-0 z-[45] flex flex-col bg-black/95"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between p-4 text-white shrink-0" style={{ paddingTop: 'calc(1rem + var(--safe-area-inset-top))' }}>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-white/30 text-white capitalize">
                {photo.angle}
              </Badge>
              <span className="text-sm text-white/80">{format(parseISO(photo.date), 'MMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-1">
              {isWithinEditWindow(photo.date) && (
                <button
                  onClick={() => onRequestDelete(photo)}
                  className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                  title="Delete photo"
                >
                  <Trash2 className="size-5" />
                </button>
              )}
              <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10 transition-colors" title="Close">
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* Image */}
          <div className="relative flex-1 flex items-center justify-center overflow-hidden px-2">
            {url ? (
              <motion.img
                key={photo.id}
                src={url}
                alt={`Progress photo, ${photo.angle}, ${photo.date}`}
                className="max-h-full max-w-full object-contain"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.15 }}
              />
            ) : (
              <div className="h-16 w-16 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            )}

            {photos.length > 1 && (
              <>
                <button
                  onClick={goPrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
                  title="Previous photo"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  onClick={goNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
                  title="Next photo"
                >
                  <ChevronRight className="size-5" />
                </button>
              </>
            )}
          </div>

          {/* Bottom info / position indicator */}
          <div className="flex items-center justify-center gap-3 p-4 text-white/70 text-xs shrink-0" style={{ paddingBottom: 'calc(1rem + var(--safe-area-inset-bottom))' }}>
            {photo.weight_kg && <span>{photo.weight_kg} kg</span>}
            {photos.length > 1 && (
              <span>
                {index + 1} / {photos.length}
              </span>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
