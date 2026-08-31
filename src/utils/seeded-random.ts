/**
 * Minimal deterministic PRNG (mulberry32) + string seeding helper.
 * Used to produce a stable-but-varied daily shuffle: the same date always
 * produces the same order (so reloading the page doesn't change the
 * suggestion), but different dates produce a different order.
 */
function hashStringToSeed(str: string): number {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return h >>> 0
}

function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Deterministically shuffles `items` using `seed` as the random source.
 * Same seed + same items => same order every time.
 */
export function seededShuffle<T>(items: T[], seed: string): T[] {
  const rand = mulberry32(hashStringToSeed(seed))
  const arr = items.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
