import * as React from 'react'
import { cn } from '@/lib/utils'
import { User } from 'lucide-react'

export function Avatar({
  src,
  alt,
  fallback,
  size = 40,
  className,
}: {
  src?: string | null
  alt?: string
  fallback?: string
  size?: number
  className?: string
}) {
  const [error, setError] = React.useState(false)

  return (
    <div
      className={cn(
        'relative flex items-center justify-center overflow-hidden rounded-full gradient-primary text-white font-semibold shrink-0',
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {src && !error ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" onError={() => setError(true)} />
      ) : fallback ? (
        <span>{fallback.slice(0, 2).toUpperCase()}</span>
      ) : (
        <User style={{ width: size * 0.55, height: size * 0.55 }} />
      )}
    </div>
  )
}
