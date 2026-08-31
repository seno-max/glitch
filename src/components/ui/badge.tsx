import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary/15 text-primary border-primary/20',
        secondary: 'bg-secondary/15 text-secondary border-secondary/20',
        success: 'bg-success/15 text-success border-success/20',
        warning: 'bg-warning/15 text-warning border-warning/20',
        destructive: 'bg-destructive/15 text-destructive border-destructive/20',
        outline: 'text-foreground border-border',
        gold: 'bg-amber-400/20 text-amber-600 dark:text-amber-400 border-amber-400/30',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
