import { useCallback, useRef, useState } from 'react'

/**
 * Wraps an async action so a second invocation while the first is still in
 * flight is ignored instead of firing a duplicate request.
 *
 * Why this is needed even though every "Save"/"Delete" button already
 * disables itself via a mutation's `isPending`: that `disabled` attribute
 * only takes effect after React re-renders and the browser paints, which
 * is NOT synchronous with the click. A fast double-click/double-tap (easy
 * to do by accident, e.g. tapping "Save Workout" twice) can fire the
 * `onClick` handler a second time before that re-render lands, sending two
 * requests and creating two duplicate rows (e.g. two workout sessions for
 * the same day from a single double-tap).
 *
 * This hook closes that gap with a plain `useRef` boolean flag, which is
 * set synchronously the instant the handler runs -- no render/paint cycle
 * required -- so the second call bails out immediately regardless of how
 * fast the two clicks land.
 */
export function useSingleFlight<Args extends unknown[]>(
  action: (...args: Args) => Promise<unknown>
): [(...args: Args) => Promise<void>, boolean] {
  const inFlight = useRef(false)
  const [isRunning, setIsRunning] = useState(false)

  const guarded = useCallback(
    async (...args: Args) => {
      if (inFlight.current) return
      inFlight.current = true
      setIsRunning(true)
      try {
        await action(...args)
      } finally {
        inFlight.current = false
        setIsRunning(false)
      }
    },
    [action]
  )

  return [guarded, isRunning]
}

/**
 * Same idea as useSingleFlight, but keyed -- for action buttons rendered
 * per-row in a list (e.g. delete buttons for each meal/water log/weight
 * entry), where only the specific row being acted on should be locked,
 * not every row in the list.
 */
export function useKeyedSingleFlight<Key extends string, Args extends unknown[]>(
  action: (key: Key, ...args: Args) => Promise<unknown>
): [(key: Key, ...args: Args) => Promise<void>, (key: Key) => boolean] {
  const inFlight = useRef<Set<Key>>(new Set())
  const [runningKeys, setRunningKeys] = useState<Set<Key>>(new Set())

  const guarded = useCallback(
    async (key: Key, ...args: Args) => {
      if (inFlight.current.has(key)) return
      inFlight.current.add(key)
      setRunningKeys(new Set(inFlight.current))
      try {
        await action(key, ...args)
      } finally {
        inFlight.current.delete(key)
        setRunningKeys(new Set(inFlight.current))
      }
    },
    [action]
  )

  const isKeyRunning = useCallback((key: Key) => runningKeys.has(key), [runningKeys])

  return [guarded, isKeyRunning]
}
