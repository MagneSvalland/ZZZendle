import { describe, it, expect } from 'vitest'
import { parseHash, summarize } from './globalStats'

describe('parseHash', () => {
  it('turns a flat HGETALL reply into a histogram', () => {
    expect(parseHash(['3', '5', '1', '2'])).toEqual({ '3': 5, '1': 2 })
  })
  it('handles empty and malformed replies', () => {
    expect(parseHash(null)).toEqual({})
    expect(parseHash(['3', 'x'])).toEqual({})
  })
})

describe('summarize', () => {
  it('returns null when there are no results', () => {
    expect(summarize({}, 4)).toBeNull()
  })

  it('flags the first solver of the day', () => {
    expect(summarize({ '3': 1 }, 3)).toMatchObject({ average: 3, first: true })
  })

  it('compares against the first player from the second one on', () => {
    expect(summarize({ '3': 1, '2': 1 }, 2)).toEqual({
      average: 2.5, topPercent: 50, bestShare: null, soloBest: true, first: false,
    })
    expect(summarize({ '3': 1, '2': 1 }, 3)).toMatchObject({ topPercent: 100, bestShare: null, soloBest: false })
  })

  it('gives ties the best shared rank when someone did better', () => {
    // 10 × 1, 20 × 3, 10 × 7 → avg 3.5
    const h = { '1': 10, '3': 20, '7': 10 }
    expect(summarize(h, 3)).toMatchObject({ average: 3.5, topPercent: 28, bestShare: null }) // 11/40 = 27.5%
    expect(summarize(h, 7)).toMatchObject({ average: 3.5, topPercent: 78, bestShare: null }) // 31/40 = 77.5%
  })

  it('reports the share tied for the best result instead of a "top X%"', () => {
    // ~25 players, nearly all first try: not "top 4%"
    const h = { '1': 23, '2': 2 }
    expect(summarize(h, 1)).toMatchObject({ average: 1.1, bestShare: 92, soloBest: false })
    expect(summarize({ '1': 10, '3': 20, '7': 10 }, 1)).toMatchObject({ bestShare: 25 })
  })

  it('flags a solo best result', () => {
    expect(summarize({ '1': 1, '4': 30 }, 1)).toMatchObject({ bestShare: null, soloBest: true })
  })
})
