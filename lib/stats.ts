import type { GuessComparison, StreakData } from './types'
import { DEFAULT_TILE_SCHEME, type TileColorScheme } from './tileColorScheme'

const START_DATE = '2026-06-20'

export interface StatsData {
  played: number
  won: number
  distribution: Record<string, number>
}

export function defaultStats(): StatsData {
  return {
    played: 0,
    won: 0,
    distribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0, '8': 0, X: 0 },
  }
}

export function loadStats(mode: string): StatsData {
  try {
    const raw = localStorage.getItem(`zzzendle-${mode}-stats`)
    if (raw) return { ...defaultStats(), ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return defaultStats()
}

export function recordResult(mode: string, won: boolean, guessCount: number): StatsData {
  const s = loadStats(mode)
  s.played += 1
  if (won) {
    s.won += 1
    const k = String(guessCount)
    s.distribution[k] = (s.distribution[k] ?? 0) + 1
  } else {
    s.distribution.X = (s.distribution.X ?? 0) + 1
  }
  localStorage.setItem(`zzzendle-${mode}-stats`, JSON.stringify(s))
  return s
}

// A win extends the streak only if yesterday was also a win (`lastWinDate`
// still equal to today - 1 day); any other outcome (a loss, or a win after
// a missed day) resets it to 1. `todayStr` is parsed the same way the two
// callers (Game.tsx, GenericModeGame.tsx) already did before this was
// extracted — `new Date(todayStr)`, not the `+'T12:00:00'` pattern used
// elsewhere in the codebase, so this stays a pure behavior-preserving move.
export function computeNextStreak(current: StreakData, won: boolean, todayStr: string): StreakData {
  if (!won) return { ...current, streak: 0 }
  const prev = new Date(todayStr)
  prev.setDate(prev.getDate() - 1)
  const prevStr = prev.toLocaleDateString('en-CA')
  const newStreak = current.lastWinDate === prevStr ? current.streak + 1 : 1
  return {
    streak: newStreak,
    bestStreak: Math.max(current.bestStreak, newStreak),
    lastWinDate: todayStr,
  }
}

export function getPuzzleNumber(dateStr: string): number {
  const start = new Date(START_DATE + 'T12:00:00')
  const date = new Date(dateStr + 'T12:00:00')
  return Math.max(1, Math.floor((date.getTime() - start.getTime()) / 86_400_000) + 1)
}

const MODE_ICONS: Record<string, string> = {
  classic: '🎯',
  splash: '🖼️',
  emoji: '😊',
  quote: '💬',
}

const MODE_NAMES: Record<string, string> = {
  classic: 'Classic',
  splash: 'Splash',
  emoji: 'Emoji',
  quote: 'Quote',
}

const SITE_URL = 'https://www.zzzendle.com'

// Share squares mirror the in-game tile colors of the player's chosen scheme
// (lib/tileColorScheme.ts) so the pasted grid looks like what they saw.
const SHARE_SQUARES: Record<TileColorScheme, { exact: string; partial: string; none: string }> = {
  vivid: { exact: '🟩', partial: '🟧', none: '🟥' },
  classic: { exact: '🟨', partial: '🟧', none: '⬛' },
}

export function buildShareText(opts: {
  mode: string
  puzzleNumber: number
  status: 'won' | 'lost'
  guessCount: number
  comparisons?: GuessComparison[]
  streak?: number
  scheme?: TileColorScheme
}): string {
  const { mode, puzzleNumber, status, guessCount, comparisons, streak, scheme = DEFAULT_TILE_SCHEME } = opts
  const sq = SHARE_SQUARES[scheme]
  const icon = MODE_ICONS[mode] ?? '🎮'
  const score = status === 'won' ? `${guessCount}` : 'X'

  let grid: string
  if (comparisons && comparisons.length > 0) {
    grid = comparisons.map(c => {
      const { attribute, faction, specialty, rank, gender, release } = c.results
      const squares = [attribute, faction, specialty, rank, gender]
        .map(r => r === 'exact' ? sq.exact : r === 'partial' ? sq.partial : sq.none)
      // Release only ever compares exact/earlier/later/none (no 'partial'),
      // and the in-game tile colors earlier/later the same as no-match
      // (differentiated only by an arrow glyph) — mirrored here the same way.
      squares.push(release === 'exact' ? sq.exact : sq.none)
      return squares.join('')
    }).join('\n')
  } else {
    const squares = Array(guessCount).fill(sq.none)
    if (status === 'won') squares[squares.length - 1] = sq.exact
    grid = squares.join('')
  }

  const streakPart = streak && streak > 0 ? ` · 🔥 ${streak}` : ''
  const header = `#ZZZendle ${icon} #${puzzleNumber} — ${score} guess${score === '1' ? '' : 'es'}${streakPart}`
  return `${header}\n${grid}\n${SITE_URL}`
}

export const DAILY_MODES = ['classic', 'quote', 'emoji', 'splash'] as const

export interface DailyResult {
  mode: string
  status: 'won' | 'lost'
  guessCount: number
}

// Classic predates the per-mode key naming, hence the special case.
export function gameStorageKey(mode: string, date: string): string {
  return mode === 'classic' ? `zzzendle-game-${date}` : `zzzendle-${mode}-game-${date}`
}

/** Finished daily games for `date`, read from the per-mode saved game state. */
export function loadDailyResults(date: string): DailyResult[] {
  const results: DailyResult[] = []
  for (const mode of DAILY_MODES) {
    try {
      const raw = localStorage.getItem(gameStorageKey(mode, date))
      if (!raw) continue
      const { status, guesses } = JSON.parse(raw)
      if ((status === 'won' || status === 'lost') && Array.isArray(guesses)) {
        results.push({ mode, status, guessCount: guesses.length })
      }
    } catch { /* ignore */ }
  }
  return results
}

export function buildDailySummary(puzzleNumber: number, results: DailyResult[]): string {
  const byMode = new Map(results.map(r => [r.mode, r]))
  const solved = results.filter(r => r.status === 'won').length
  const parts = DAILY_MODES.map(mode => {
    const r = byMode.get(mode)
    const score = !r ? '—' : r.status === 'won' ? String(r.guessCount) : 'X'
    return `${MODE_ICONS[mode]} ${MODE_NAMES[mode]} ${score}`
  })
  return [
    `#ZZZendle #${puzzleNumber} — ${solved}/${DAILY_MODES.length} solved`,
    `${parts[0]} · ${parts[1]}`,
    `${parts[2]} · ${parts[3]}`,
    SITE_URL,
  ].join('\n')
}
