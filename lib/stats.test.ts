// @vitest-environment jsdom
//
// jsdom is needed here (unlike the other lib/*.test.ts files) because
// loadStats/recordResult read and write `localStorage`, which only exists
// in a browser-like environment.
import { describe, it, expect, beforeEach } from 'vitest'
import {
  defaultStats,
  loadStats,
  recordResult,
  computeNextStreak,
  getPuzzleNumber,
  buildShareText,
} from './stats'
import type { StreakData } from './types'

beforeEach(() => {
  localStorage.clear()
})

describe('defaultStats', () => {
  it('starts at zero with an empty distribution', () => {
    const s = defaultStats()
    expect(s.played).toBe(0)
    expect(s.won).toBe(0)
    expect(s.distribution).toEqual({ '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0, '8': 0, X: 0 })
  })
})

describe('loadStats / recordResult', () => {
  it('falls back to default stats when nothing is saved', () => {
    expect(loadStats('classic')).toEqual(defaultStats())
  })

  it('keeps modes independent', () => {
    recordResult('classic', true, 3)
    expect(loadStats('classic').played).toBe(1)
    expect(loadStats('emoji').played).toBe(0)
  })

  it('increments played and won, and buckets the guess count on a win', () => {
    const s = recordResult('classic', true, 4)
    expect(s.played).toBe(1)
    expect(s.won).toBe(1)
    expect(s.distribution['4']).toBe(1)
  })

  it('increments played but not won, and buckets under X, on a loss', () => {
    const s = recordResult('classic', false, 8)
    expect(s.played).toBe(1)
    expect(s.won).toBe(0)
    expect(s.distribution.X).toBe(1)
  })

  it('persists across separate loadStats calls', () => {
    recordResult('classic', true, 2)
    recordResult('classic', true, 2)
    const s = loadStats('classic')
    expect(s.played).toBe(2)
    expect(s.distribution['2']).toBe(2)
  })
})

describe('computeNextStreak', () => {
  const yesterday: StreakData = { streak: 4, bestStreak: 9, lastWinDate: '2026-09-06' }

  it('extends the streak when the last win was exactly yesterday', () => {
    const next = computeNextStreak(yesterday, true, '2026-09-07')
    expect(next).toEqual({ streak: 5, bestStreak: 9, lastWinDate: '2026-09-07' })
  })

  it('resets the streak to 1 on a win after a missed day', () => {
    const stale: StreakData = { streak: 4, bestStreak: 9, lastWinDate: '2026-09-01' }
    const next = computeNextStreak(stale, true, '2026-09-07')
    expect(next).toEqual({ streak: 1, bestStreak: 9, lastWinDate: '2026-09-07' })
  })

  it('starts a fresh streak at 1 when there was no prior win', () => {
    const fresh: StreakData = { streak: 0, bestStreak: 0, lastWinDate: null }
    expect(computeNextStreak(fresh, true, '2026-09-07')).toEqual({
      streak: 1, bestStreak: 1, lastWinDate: '2026-09-07',
    })
  })

  it('raises bestStreak when the new streak beats it', () => {
    const next = computeNextStreak(yesterday, true, '2026-09-07')
    expect(next.bestStreak).toBe(9) // unchanged, 5 < 9
    const onARoll: StreakData = { streak: 9, bestStreak: 9, lastWinDate: '2026-09-06' }
    expect(computeNextStreak(onARoll, true, '2026-09-07').bestStreak).toBe(10)
  })

  it('zeroes the streak on a loss but keeps bestStreak and lastWinDate', () => {
    const next = computeNextStreak(yesterday, false, '2026-09-07')
    expect(next).toEqual({ streak: 0, bestStreak: 9, lastWinDate: '2026-09-06' })
  })
})

describe('getPuzzleNumber', () => {
  it('is 1 on launch day', () => {
    expect(getPuzzleNumber('2026-06-20')).toBe(1)
  })

  it('increments by one per day after launch', () => {
    expect(getPuzzleNumber('2026-06-21')).toBe(2)
    expect(getPuzzleNumber('2026-06-27')).toBe(8)
  })

  it('never goes below 1 for a date before launch', () => {
    expect(getPuzzleNumber('2020-01-01')).toBe(1)
  })
})

describe('buildShareText', () => {
  it('shows the guess count and a green square on the final row for a win', () => {
    const text = buildShareText({ mode: 'classic', puzzleNumber: 42, status: 'won', guessCount: 3 })
    expect(text).toContain('#ZZZendle 🎯 #42 — 3 guesses')
    const lines = text.trim().split('\n')
    const gridLine = lines[lines.length - 1]
    expect(gridLine).toBe('⬛⬛🟩')
  })

  it('uses singular "guess" for a one-guess win', () => {
    const text = buildShareText({ mode: 'classic', puzzleNumber: 1, status: 'won', guessCount: 1 })
    expect(text).toContain('— 1 guess')
    expect(text).not.toContain('1 guesses')
  })

  it('shows X and an all-black row for a loss', () => {
    const text = buildShareText({ mode: 'classic', puzzleNumber: 1, status: 'lost', guessCount: 8 })
    expect(text).toContain('— X guesses')
    const lines = text.trim().split('\n')
    expect(lines[lines.length - 1]).toBe('⬛⬛⬛⬛⬛⬛⬛⬛')
  })

  it('renders one 6-square emoji row per comparison, including release', () => {
    const comparisons = [
      { agent: {} as never, isCorrect: false, results: { faction: 'exact', attribute: 'partial', specialty: 'none', rank: 'exact', gender: 'none', release: 'exact' } as never },
      { agent: {} as never, isCorrect: true, results: { faction: 'exact', attribute: 'exact', specialty: 'exact', rank: 'exact', gender: 'exact', release: 'exact' } as never },
    ]
    const text = buildShareText({ mode: 'classic', puzzleNumber: 1, status: 'won', guessCount: 2, comparisons })
    const lines = text.trim().split('\n')
    // Square order per row is [attribute, faction, specialty, rank, gender, release] —
    // 6 tiles, matching the 6 tiles GuessRow actually shows in-game (the
    // release/version tile was missing from this grid for a while).
    expect(lines[lines.length - 2]).toBe('🟨🟩⬛🟩⬛🟩')
    expect(lines[lines.length - 1]).toBe('🟩🟩🟩🟩🟩🟩')
  })

  it('renders a black square for release when it is earlier or later, not just when it mismatches', () => {
    const comparisons = [
      { agent: {} as never, isCorrect: false, results: { faction: 'exact', attribute: 'exact', specialty: 'exact', rank: 'exact', gender: 'exact', release: 'earlier' } as never },
      { agent: {} as never, isCorrect: false, results: { faction: 'exact', attribute: 'exact', specialty: 'exact', rank: 'exact', gender: 'exact', release: 'later' } as never },
    ]
    const text = buildShareText({ mode: 'classic', puzzleNumber: 1, status: 'lost', guessCount: 2, comparisons })
    const lines = text.trim().split('\n')
    expect(lines[lines.length - 2]).toBe('🟩🟩🟩🟩🟩⬛')
    expect(lines[lines.length - 1]).toBe('🟩🟩🟩🟩🟩⬛')
  })

  it('picks the right icon and name per mode', () => {
    expect(buildShareText({ mode: 'splash', puzzleNumber: 1, status: 'won', guessCount: 1 })).toContain('🖼️')
    expect(buildShareText({ mode: 'emoji', puzzleNumber: 1, status: 'won', guessCount: 1 })).toContain('😊')
    expect(buildShareText({ mode: 'quote', puzzleNumber: 1, status: 'won', guessCount: 1 })).toContain('💬')
  })

  it('falls back to a generic icon for an unknown mode', () => {
    expect(buildShareText({ mode: 'mystery', puzzleNumber: 1, status: 'won', guessCount: 1 })).toContain('🎮')
  })

  it('includes a stats line only when stats, streak and bestStreak are all provided', () => {
    const withoutStats = buildShareText({ mode: 'classic', puzzleNumber: 1, status: 'won', guessCount: 1 })
    expect(withoutStats).not.toContain('My Classic stats')

    const stats = { played: 5, won: 4, distribution: { ...defaultStats().distribution, '2': 2, '3': 2 } }
    const withStats = buildShareText({
      mode: 'classic', puzzleNumber: 1, status: 'won', guessCount: 1, stats, streak: 3, bestStreak: 5,
    })
    expect(withStats).toContain('My Classic stats')
    expect(withStats).toContain('4 wins')
    expect(withStats).toContain('3 streak')
  })
})
