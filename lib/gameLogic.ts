import type { Agent, AttributeResults, GuessComparison, MatchResult } from './types'

function match(a: string, b: string): MatchResult {
  return a === b ? 'exact' : 'none'
}

// Compare release versions like "2.0" numerically (major, then minor).
// 'earlier' = the target released in a newer version than the guess (arrow up),
// 'later'   = the target released in an older version (arrow down).
function compareVersions(guessVer: string, targetVer: string): 'exact' | 'earlier' | 'later' | 'none' {
  const parse = (v: string) => v.split('.').map(n => parseInt(n, 10))
  const [gMaj, gMin = 0] = parse(guessVer)
  const [tMaj, tMin = 0] = parse(targetVer)
  if (isNaN(gMaj) || isNaN(tMaj)) return 'none'
  if (gMaj === tMaj && gMin === tMin) return 'exact'
  if (gMaj < tMaj || (gMaj === tMaj && gMin < tMin)) return 'earlier'
  return 'later'
}

export function compareAgents(guess: Agent, target: Agent): GuessComparison {
  const results: AttributeResults = {
    faction: match(guess.faction, target.faction),
    attribute: match(guess.attribute, target.attribute),
    specialty: match(guess.specialty, target.specialty),
    rank: match(guess.rank, target.rank),
    gender: match(guess.gender, target.gender),
    release: compareVersions(guess.release_version, target.release_version),
  }
  return { agent: guess, results, isCorrect: guess.id === target.id }
}
