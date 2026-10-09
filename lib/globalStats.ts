// Shared, pure half of the global (all-players) stats shown on the result
// screen. The server keeps one histogram per mode and day in Redis
// (guess count → number of players, see app/api/stats/route.ts) and turns it
// into just an average and a "top X%" before responding. The raw counts never
// leave the server, so the size of the player base isn't exposed.

export type Histogram = Record<string, number>

export interface GlobalSummary {
  average: number
  /** Share of players who did as well or better, 1–100. */
  topPercent: number
  /** Nobody else has solved it yet today, so there's nothing to compare with. */
  first: boolean
}

/** Redis HGETALL over REST returns a flat [field, value, field, value, …] array. */
export function parseHash(flat: unknown): Histogram {
  const h: Histogram = {}
  if (!Array.isArray(flat)) return h
  for (let i = 0; i + 1 < flat.length; i += 2) {
    const n = Number(flat[i + 1])
    if (Number.isFinite(n) && n > 0) h[String(flat[i])] = n
  }
  return h
}

/**
 * Average guesses and the player's "top X%" in `h`. Ties share the best
 * rank: X is (players who did strictly better + 1) / all, so a first-try
 * solve is "top 1%" even when most players also got it first try.
 */
export function summarize(h: Histogram, guessCount: number): GlobalSummary | null {
  let n = 0
  let sum = 0
  let better = 0
  for (const [k, count] of Object.entries(h)) {
    const g = Number(k)
    n += count
    sum += g * count
    if (g < guessCount) better += count
  }
  if (n === 0) return null
  return {
    average: Math.round((sum / n) * 10) / 10,
    topPercent: Math.min(100, Math.max(1, Math.round(((better + 1) / n) * 100))),
    first: n === 1,
  }
}
