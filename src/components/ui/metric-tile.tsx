import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ACCENT_GRADIENT, type AccentKey } from '@/utils/accent'

/**
 * Single shared "icon + number + label" tile, replacing three near-duplicate
 * implementations that had each drifted into a slightly different visual
 * style (dashboard StatCard, Profile's local StatTile, Analytics' local
 * Metric). Using one component keeps every stat across Home, Profile, and
 * Analytics visually consistent instead of three competing styles.
 *
 * Purely presentational — does not read/write any data itself.
 */
export function MetricTile({
  icon: Icon,
  label,
  value,
  subValue,
  accent = 'primary',
  align = 'start',
  delay = 0,
  onClick,
}: {
  icon: LucideIcon
  label: string
  value: string | number
  subValue?: string
  /** One of the app's 4 shared accent colors (see utils/accent.ts) — keeps every tile on the same restrained palette instead of a new gradient per usage. */
  accent?: AccentKey
  /** "start" (label/value left, icon right — used on Home) or "center" (icon on top — used on Profile/Analytics grids). */
  align?: 'start' | 'center'
  delay?: number
  onClick?: () => void
}) {
  const gradient = ACCENT_GRADIENT[accent]

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.3 }}>
      <Card weight="flat" className={cn('card-hover relative overflow-hidden', onClick && 'cursor-pointer')} onClick={onClick}>
        <CardContent className={cn('p-4', align === 'center' && 'flex flex-col items-center text-center gap-1.5')}>
          {align === 'center' ? (
            <>
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl shadow-sm', gradient)}>
                <Icon className="size-5 text-white" />
              </div>
              <p className="text-lg font-bold tabular-nums">{value}</p>
              <p className="text-[11px] text-muted-foreground">{label}</p>
            </>
          ) : (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground mb-1 truncate">{label}</p>
                <p className="text-xl font-bold tracking-tight tabular-nums">{value}</p>
                {subValue && <p className="text-xs text-muted-foreground mt-0.5 truncate">{subValue}</p>}
              </div>
              <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl shrink-0', gradient)}>
                <Icon className="size-4 text-white" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
