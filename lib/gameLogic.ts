import type { Agent, AttributeResults, GuessComparison, MatchResult } from './types'

function match(a: string, b: string): MatchResult {
  return a === b ? 'exact' : 'none'
}

export function compareAgents(guess: Agent, target: Agent): GuessComparison {
  const results: AttributeResults = {
    faction: match(guess.faction, target.faction),
    attribute: match(guess.attribute, target.attribute),
    specialty: match(guess.specialty, target.specialty),
    attack_type: match(guess.attack_type, target.attack_type),
    rank: match(guess.rank, target.rank),
    gender: match(guess.gender, target.gender),
  }
  return { agent: guess, results, isCorrect: guess.id === target.id }
}
