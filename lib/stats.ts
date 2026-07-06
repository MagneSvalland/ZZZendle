import type { GuessComparison } from './types'

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

export function buildShareText(opts: {
  mode: string
  puzzleNumber: number
  status: 'won' | 'lost'
  guessCount: number
  comparisons?: GuessComparison[]
  stats?: StatsData
  streak?: number
  bestStreak?: number
}): string {
  const { mode, puzzleNumber, status, guessCount, comparisons, stats, streak, bestStreak } = opts
  const icon = MODE_ICONS[mode] ?? '🎮'
  const score = status === 'won' ? `${guessCount}` : 'X'
  const modeName = MODE_NAMES[mode] ?? mode

  let grid: string
  if (comparisons && comparisons.length > 0) {
    grid = comparisons.map(c => {
      const { attribute, faction, specialty, rank, gender, release_date } = c.results
      const releaseEmoji = release_date === 'exact' ? '🟩' : release_date === 'none' ? '⬛' : '🟨'
      return [attribute, faction, specialty, rank, gender]
        .map(r => r === 'exact' ? '🟩' : r === 'partial' ? '🟨' : '⬛')
        .join('') + releaseEmoji
    }).join('\n')
  } else {
    const squares = Array(guessCount).fill('⬛')
    if (status === 'won') squares[squares.length - 1] = '🟩'
    grid = squares.join('')
  }

  let statsLine = ''
  if (stats && streak !== undefined && bestStreak !== undefined) {
    const avg = stats.won > 0
      ? (Object.entries(stats.distribution)
          .filter(([k]) => k !== 'X')
          .reduce((sum, [k, v]) => sum + Number(k) * v, 0) / stats.won).toFixed(1)
      : '—'
    const oneShots = stats.distribution['1'] ?? 0
    statsLine = `\nMy ${modeName} stats: 🎮 ${stats.won} wins · 🤓 ${avg} avg · 🥇 ${oneShots} one shots · 🔥 ${streak} streak`
  }

  return `#ZZZendle ${icon} #${puzzleNumber} — ${score} guess${score === '1' ? '' : 'es'}${statsLine}\nhttps://zzzendle.vercel.app\n${grid}`
}
