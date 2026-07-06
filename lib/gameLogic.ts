import type { Agent, AttributeResults, GuessComparison, MatchResult } from './types'

function match(a: string, b: string): MatchResult {
  return a === b ? 'exact' : 'none'
}

function compareDates(guessDate: string, targetDate: string): 'exact' | 'earlier' | 'later' | 'none' {
  if (guessDate === targetDate) return 'exact'
  const guessTime = new Date(guessDate).getTime()
  const targetTime = new Date(targetDate).getTime()
  if (isNaN(guessTime) || isNaN(targetTime)) return 'none'
  return guessTime < targetTime ? 'earlier' : 'later'
}

export function compareAgents(guess: Agent, target: Agent): GuessComparison {
  const results: AttributeResults = {
    faction: match(guess.faction, target.faction),
    attribute: match(guess.attribute, target.attribute),
    specialty: match(guess.specialty, target.specialty),
    rank: match(guess.rank, target.rank),
    gender: match(guess.gender, target.gender),
    release_date: compareDates(guess.release_date, target.release_date),
  }
  return { agent: guess, results, isCorrect: guess.id === target.id }
}
