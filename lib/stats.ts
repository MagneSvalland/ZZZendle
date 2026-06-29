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

export function buildShareText(opts: {
  mode: string
  puzzleNumber: number
  status: 'won' | 'lost'
  guessCount: number
  comparisons?: GuessComparison[]
}): string {
  const { mode, puzzleNumber, status, guessCount, comparisons } = opts
  const icon = MODE_ICONS[mode] ?? '🎮'
  const score = status === 'won' ? `${guessCount}/8` : 'X/8'

  let grid: string
  if (comparisons && comparisons.length > 0) {
    grid = comparisons.map(c => {
      const { attribute, faction, specialty, attack_type, rank, gender } = c.results
      return [attribute, faction, specialty, attack_type, rank, gender]
        .map(r => r === 'exact' ? '🟩' : '⬛')
        .join('')
    }).join('\n')
  } else {
    const squares = Array(guessCount).fill('⬛')
    if (status === 'won') squares[squares.length - 1] = '🟩'
    grid = squares.join('')
  }

  return `ZZZdle ${icon} #${puzzleNumber} ${score}\n${grid}`
}
