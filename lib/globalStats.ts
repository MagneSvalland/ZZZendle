// Shared, pure half of the global (all-players) stats shown on the result
// screen. The server keeps one histogram per mode and day in Redis
// (guess count → number of players, see app/api/stats/route.ts) and turns it
// into just an average and a "top X%" before responding. The raw counts never
// leave the server, so the size of the player base isn't exposed.

export type Histogram = Record<string, number>

export interface GlobalSummary {
  average: number
  /** (players who did strictly better + 1) / all, 1–100. Used when someone did better. */
  topPercent: number
  /**
   * Nobody did better, but others did just as well: share of players (you
   * included) with the same result, 1–100. Null otherwise.
   */
  bestShare: number | null
  /** Nobody else did as well, so you have the day's best result on your own. */
  soloBest: boolean
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

const percent = (part: number, n: number) => Math.min(100, Math.max(1, Math.round((part / n) * 100)))

/**
 * Average guesses and where the player stands in `h`. With nobody better,
 * there's no "top X%": (0 + 1) / n would only say how many played (and call
 * a first-try solve "top 4%" on a day when 90% got it first try). Instead
 * it's either the share tied for the best result or a solo best.
 */
export function summarize(h: Histogram, guessCount: number): GlobalSummary | null {
  let n = 0
  let sum = 0
  let better = 0
  let same = 0
  for (const [k, count] of Object.entries(h)) {
    const g = Number(k)
    n += count
    sum += g * count
    if (g < guessCount) better += count
    else if (g === guessCount) same += count
  }
  if (n === 0) return null
  const best = better === 0
  return {
    average: Math.round((sum / n) * 10) / 10,
    topPercent: percent(better + 1, n),
    bestShare: best && same > 1 ? percent(same, n) : null,
    soloBest: best && same === 1 && n > 1,
    first: n === 1,
  }
}
