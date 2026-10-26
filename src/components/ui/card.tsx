import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Card "weight" gives the UI a visual hierarchy instead of every card
 * looking identical regardless of importance:
 *  - flat: subtle border, no shadow — lists, settings rows, secondary content
 *  - default: the original card look (border + soft shadow) — general content
 *  - raised: stronger shadow, no visible border — today's key stat / featured content
 * Purely a presentational prop; does not affect any data or logic.
 */
const CARD_WEIGHT = {
  flat: 'border border-border bg-card shadow-none',
  default: 'border border-border bg-card shadow-sm',
  raised: 'border border-transparent bg-card shadow-lg shadow-black/5 dark:shadow-black/20',
} as const

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  weight?: keyof typeof CARD_WEIGHT
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, weight = 'default', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl text-card-foreground',
        CARD_WEIGHT[weight],
        className
      )}
      {...props}
    />
  )
)
Card.displayName = 'Card'

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-1 p-5', className)} {...props} />
  )
)
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />
  )
)
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
)
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-5 pt-0', className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-5 pt-0', className)} {...props} />
  )
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
