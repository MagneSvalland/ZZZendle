// Shared, pure half of the global (all-players) stats shown on the result
// screen. The server keeps one histogram per mode and day in Redis
// (guess count → number of players, see app/api/stats/route.ts) and turns it
// into just an average and a "top X%" before responding. The raw counts never
// leave the server, so the size of the player base isn't exposed.

/** Below this many results a percentage is too noisy to show. */
export const MIN_RESULTS = 20
/** Early players fall back to this many days (today included) of the same mode. */
export const HISTORY_DAYS = 7

export type Histogram = Record<string, number>

export interface GlobalSummary {
  average: number
  /** Share of players who did as well or better, 1–100. */
  topPercent: number
  scope: 'today' | 'week'
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

export function mergeHistograms(hs: Histogram[]): Histogram {
  const out: Histogram = {}
  for (const h of hs) for (const [k, n] of Object.entries(h)) out[k] = (out[k] ?? 0) + n
  return out
}

function total(h: Histogram): number {
  return Object.values(h).reduce((a, b) => a + b, 0)
}

/**
 * Average guesses and the player's "top X%" in `h`. Ties count half, so
 * everyone who solved it on the first try doesn't land in "top 0%".
 */
export function summarize(h: Histogram, guessCount: number): { average: number; topPercent: number } | null {
  const n = total(h)
  if (n < MIN_RESULTS) return null
  let sum = 0
  let better = 0
  for (const [k, count] of Object.entries(h)) {
    const g = Number(k)
    sum += g * count
    if (g < guessCount) better += count
  }
  const ties = h[String(guessCount)] ?? 0
  return {
    average: Math.round((sum / n) * 10) / 10,
    topPercent: Math.min(100, Math.max(1, Math.round(((better + ties / 2) / n) * 100))),
  }
}

/** Today's stats when there are enough of them, otherwise the last week's. */
export function pickSummary(today: Histogram, history: Histogram[], guessCount: number): GlobalSummary | null {
  const t = summarize(today, guessCount)
  if (t) return { ...t, scope: 'today' }
  const w = summarize(mergeHistograms([today, ...history]), guessCount)
  return w ? { ...w, scope: 'week' } : null
}
