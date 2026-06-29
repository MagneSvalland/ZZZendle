export type Rank = 'A' | 'S' | 'I'
export type Gender = 'Male' | 'Female'
export type MatchResult = 'exact' | 'partial' | 'none'

export interface Agent {
  id: string
  name: string
  rank: Rank
  attribute: string
  specialty: string
  attack_type: string
  faction: string
  release_date: string
  gender: Gender
  icon_image: string | null
  splash_image: string | null
  splash_focus: string | null
  alt_splash_images?: string[]
  quote: string
  emojis: string[]
}

export interface AttributeResults {
  faction: MatchResult
  attribute: MatchResult
  specialty: MatchResult
  attack_type: MatchResult
  rank: MatchResult
  gender: MatchResult
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
