export type Rank = 'A' | 'S' | 'I'
export type Gender = 'Male' | 'Female'
export type MatchResult = 'exact' | 'partial' | 'none'

export interface Agent {
  id: string
  name: string
  rank: Rank
  attribute: string
  specialty: string
  faction: string
  release_date: string
  release_version: string
  gender: Gender
  icon_image: string | null
  splash_image: string | null
  splash_focus: string | null
  alt_splash_images?: string[]
  alt_splash_names?: string[]
  /** Voice lines for quote mode; the first is the one used before QUOTE_VARIANTS_FROM. */
  quotes: string[]
  /** First date the agent can be the quote-mode answer (for agents given quotes later). */
  quotes_from?: string
  emojis: string[]
  available_from?: string
}

export interface AttributeResults {
  faction: MatchResult
  attribute: MatchResult
  specialty: MatchResult
  rank: MatchResult
  gender: MatchResult
  release: 'exact' | 'earlier' | 'later' | 'none'
}

export interface GuessComparison {
  agent: Agent
  results: AttributeResults
  isCorrect: boolean
}

export interface StreakData {
  streak: number
  bestStreak: number
  lastWinDate: string | null
}

export interface GameState {
  date: string
  guesses: string[]
  status: 'playing' | 'won' | 'lost'
}
