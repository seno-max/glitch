import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { exerciseLibraryService } from '@/services/exercise-library.service'
import { seededShuffle } from '@/utils/seeded-random'
import { todayStr } from '@/utils/date'

const SUGGESTION_SIZE = 4

/**
 * Picks `count` distinct exercises from `pool`, deterministically shuffled
 * by `seed` so the same seed always gives the same picks (until the caller
 * bumps `nonce` for a manual "shuffle" re-roll).
 */
function pickDaily<T>(pool: T[], seed: string, count: number): T[] {
  if (pool.length === 0) return []
  return seededShuffle(pool, seed).slice(0, Math.min(count, pool.length))
}

/**
 * Returns a deterministic "4 HIIT/cardio exercises to try today" suggestion,
 * pulled from the exercise library. The same calendar date always yields
 * the same 4 exercises (so it doesn't change on every page reload), but
 * each day gets a different set. Callers can also request a fresh re-roll
 * via `shuffle()` without waiting for the next day.
 */
export function useDailyHiitSuggestion() {
  const [nonce, setNonce] = useState(0)
  const date = todayStr()

  const { data: pool, isLoading } = useQuery({
    queryKey: ['hiit-cardio-pool'],
    queryFn: () => exerciseLibraryService.search('', { categories: ['Cardio', 'HIIT'] }),
    staleTime: 60 * 60 * 1000,
  })

  const suggestion = useMemo(() => {
    if (!pool) return []
    return pickDaily(pool, `${date}-${nonce}`, SUGGESTION_SIZE)
  }, [pool, date, nonce])

  return {
    suggestion,
    isLoading,
    shuffle: () => setNonce((n) => n + 1),
  }
}
