'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import type { Agent, GuessComparison } from '@/lib/types'
import { compareAgents } from '@/lib/gameLogic'
import { loadTileScheme, saveTileScheme, TILE_SCHEMES, DEFAULT_TILE_SCHEME, type TileColorScheme } from '@/lib/tileColorScheme'
import agentsRaw from '@/data/agents.json'
import SearchInput from './SearchInput'
import GuessRow from './GuessRow'
import ModeNav from './ModeNav'
import ZZZdleLogo from './ZZZdleLogo'
import SocialLinks from './SocialLinks'

const allAgents = agentsRaw as Agent[]

const STATS_KEY = 'zzzendle-endless-stats'
const CURRENT_KEY = 'zzzendle-endless-current'

// Avoid repeating any of the last N targets when picking the next one.
const RECENT_WINDOW = 15

interface EndlessStats {
  solved: number
  bestGuesses: number | null
}

interface CurrentRun {
  targetId: string
  guesses: string[]
  status: 'playing' | 'won' | 'revealed'
  solvedCount: number
  recent: string[]
}

function pickRandom(exclude: Set<string>): Agent {
  const pool = allAgents.filter((a) => !exclude.has(a.id))
  const from = pool.length > 0 ? pool : allAgents
  return from[Math.floor(Math.random() * from.length)]
}

export default function EndlessGame() {
  const [targetAgent, setTargetAgent] = useState<Agent | null | undefined>(undefined)
  const [guesses, setGuesses] = useState<string[]>([])
  const [status, setStatus] = useState<'playing' | 'won' | 'revealed'>('playing')
  const [solvedCount, setSolvedCount] = useState(0)
  const [stats, setStats] = useState<EndlessStats>({ solved: 0, bestGuesses: null })
  const [tileScheme, setTileScheme] = useState<TileColorScheme>(DEFAULT_TILE_SCHEME)
  const recentRef = useRef<string[]>([])

  // Load persisted stats + in-progress run, or start a fresh one.
  useEffect(() => {
    setTileScheme(loadTileScheme())
    try {
      const rawStats = localStorage.getItem(STATS_KEY)
      if (rawStats) setStats(JSON.parse(rawStats))

      const rawCur = localStorage.getItem(CURRENT_KEY)
      if (rawCur) {
        const cur: CurrentRun = JSON.parse(rawCur)
        const t = allAgents.find((a) => a.id === cur.targetId)
        if (t) {
          setTargetAgent(t)
          setGuesses(cur.guesses ?? [])
          setStatus(cur.status ?? 'playing')
          setSolvedCount(cur.solvedCount ?? 0)
          recentRef.current = cur.recent ?? [t.id]
          return
        }
      }
    } catch { /* ignore */ }

    const first = pickRandom(new Set())
    recentRef.current = [first.id]
    setTargetAgent(first)
  }, [])

  // Persist the current run so a refresh continues where you left off.
  useEffect(() => {
    if (!targetAgent) return
    const cur: CurrentRun = {
      targetId: targetAgent.id,
      guesses,
      status,
      solvedCount,
      recent: recentRef.current,
    }
    localStorage.setItem(CURRENT_KEY, JSON.stringify(cur))
  }, [targetAgent, guesses, status, solvedCount])

  function persistStats(next: EndlessStats) {
    setStats(next)
    localStorage.setItem(STATS_KEY, JSON.stringify(next))
  }

  function handleGuess(agentId: string) {
    if (status !== 'playing' || !targetAgent) return
    if (guesses.includes(agentId)) return

    const newGuesses = [...guesses, agentId]
    setGuesses(newGuesses)

    if (agentId === targetAgent.id) {
      setStatus('won')
      setSolvedCount((c) => c + 1)
      const best =
        stats.bestGuesses == null
          ? newGuesses.length
          : Math.min(stats.bestGuesses, newGuesses.length)
      persistStats({ solved: stats.solved + 1, bestGuesses: best })
    }
  }

  function nextAgent() {
    const next = pickRandom(new Set(recentRef.current))
    recentRef.current = [next.id, ...recentRef.current].slice(0, RECENT_WINDOW)
    setTargetAgent(next)
    setGuesses([])
    setStatus('playing')
  }

  function giveUp() {
    if (status !== 'playing') return
    setStatus('revealed')
  }

  if (targetAgent === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-zinc-500 text-sm animate-pulse">Loading…</div>
      </div>
    )
  }

  if (targetAgent === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <ZZZdleLogo />
        <p className="text-zinc-400 text-center">No agents available.</p>
      </div>
    )
  }

  const comparisons: GuessComparison[] = guesses.map((id) =>
    compareAgents(allAgents.find((a) => a.id === id)!, targetAgent),
  )
  const isOver = status !== 'playing'

  return (
    <div className="min-h-screen flex items-start justify-center px-4 py-8 sm:py-12">
      <div className="
        w-full max-w-5xl flex flex-col gap-6
        rounded-2xl border border-yellow-500/10
        bg-white/[0.018] backdrop-blur-sm
        shadow-[0_0_60px_rgba(250,204,21,0.04),0_0_120px_rgba(163,230,53,0.02)]
        p-4 sm:p-8
      ">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <ZZZdleLogo zSize="text-3xl sm:text-4xl" dleSize="text-3xl sm:text-4xl" />
            <p className="text-xs text-yellow-400/80 mt-1 font-semibold tracking-wide uppercase">
              ♾️ Endless
            </p>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="text-right">
              <div className="text-lg sm:text-xl font-bold text-amber-400">{solvedCount}</div>
              <div className="text-[9px] sm:text-[10px] text-zinc-400 uppercase tracking-wider">Solved</div>
            </div>
            <div className="text-right">
              <div className="text-lg sm:text-xl font-bold text-zinc-300">{guesses.length}</div>
              <div className="text-[9px] sm:text-[10px] text-zinc-400 uppercase tracking-wider">Guesses</div>
            </div>
            <div className="w-px h-8 bg-zinc-800" />
            <div className="text-right">
              <div className="text-lg sm:text-xl font-bold text-zinc-300">
                {stats.bestGuesses ?? '—'}
              </div>
              <div className="text-[9px] sm:text-[10px] text-zinc-400 uppercase tracking-wider">Best</div>
            </div>
          </div>
        </div>

        {/* Mode navigation */}
        <ModeNav />

        <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-700/60 to-transparent" />

        {/* Prompt */}
        {!isOver && (
          <div className="text-center">
            <p className="text-zinc-300 text-sm">
              Guess a{' '}
              <span className="text-yellow-400 font-semibold">random</span> agent.
              Keep going as long as you like
            </p>
          </div>
        )}

        {/* Search input */}
        {!isOver && (
          <div className="w-full flex flex-col items-center gap-3">
            <SearchInput
              agents={allAgents}
              guessedIds={guesses}
              disabled={false}
              onGuess={handleGuess}
            />
            {guesses.length > 0 && (
              <button
                onClick={giveUp}
                className="text-[11px] text-zinc-600 hover:text-red-400 transition-colors"
              >
                Give up &amp; reveal
              </button>
            )}
          </div>
        )}

        {/* Result panel */}
        {isOver && (
          <NextPanel
            targetAgent={targetAgent}
            status={status}
            guessCount={guesses.length}
            solvedCount={solvedCount}
            onNext={nextAgent}
          />
        )}

        {/* Guess history */}
        {comparisons.length > 0 && (
          <div className="w-full flex flex-col gap-2">
            {[...comparisons].reverse().map((c, i) => (
              <GuessRow key={c.agent.id} comparison={c} guessNumber={comparisons.length - i} scheme={tileScheme} />
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-5 text-xs text-zinc-400 justify-center sm:justify-start">
          <span className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded-sm inline-block ${TILE_SCHEMES[tileScheme].legendExact}`} />
            Exact match
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded-sm inline-block ${TILE_SCHEMES[tileScheme].legendPartial}`} />
            Partial match
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded-sm inline-block ${TILE_SCHEMES[tileScheme].legendNone}`} />
            No match
          </span>
          <button
            type="button"
            onClick={() => {
              const next = tileScheme === 'vivid' ? 'classic' : 'vivid'
              setTileScheme(next)
              saveTileScheme(next)
            }}
            className="text-zinc-600 hover:text-yellow-400 transition-colors underline decoration-dotted"
          >
            {tileScheme === 'vivid' ? 'Miss the old yellow/gray colors? Switch back' : 'Prefer the new colors? Switch back'}
          </button>
        </div>

        <SocialLinks />
      </div>
    </div>
  )
}

function NextPanel({
  targetAgent,
  status,
  guessCount,
  solvedCount,
  onNext,
}: {
  targetAgent: Agent
  status: 'won' | 'revealed'
  guessCount: number
  solvedCount: number
  onNext: () => void
}) {
  const won = status === 'won'

  // Enter / Space advances to the next agent.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onNext()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onNext])

  return (
    <div
      className={`w-full rounded-xl border p-6 flex flex-col sm:flex-row items-center gap-6 ${
        won
          ? 'border-yellow-500/30 bg-yellow-950/10 shadow-[0_0_30px_rgba(250,204,21,0.05)]'
          : 'border-zinc-600/40 bg-zinc-900/40'
      }`}
    >
      <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-zinc-900 shrink-0 border border-zinc-700/40">
        <span className="absolute inset-0 flex items-center justify-center text-2xl font-black text-zinc-700 select-none">
          {targetAgent.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
        </span>
        {(targetAgent.icon_image ?? targetAgent.splash_image) && (
          <Image
            src={(targetAgent.icon_image ?? targetAgent.splash_image)!}
            alt={targetAgent.name}
            fill
            className="object-cover object-top"
            sizes="96px"
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).style.display = 'none'
            }}
          />
        )}
      </div>

      <div className="flex flex-col gap-2 text-center sm:text-left flex-1">
        {won ? (
          <>
            <div className="text-yellow-300 font-black text-xl tracking-tight">
              {guessCount === 1 ? 'First try!' : guessCount <= 3 ? 'Nice work!' : 'Got it!'}
            </div>
            <div className="text-zinc-300 text-sm">
              <span className="text-white font-semibold">{targetAgent.name}</span> in{' '}
              <span className="text-yellow-400 font-semibold">{guessCount}</span>{' '}
              {guessCount === 1 ? 'guess' : 'guesses'} · {solvedCount} solved this run
            </div>
          </>
        ) : (
          <>
            <div className="text-zinc-200 font-black text-xl tracking-tight">Revealed</div>
            <div className="text-zinc-400 text-sm">
              It was <span className="text-white font-semibold">{targetAgent.name}</span>
            </div>
          </>
        )}

        <div className="flex flex-wrap gap-1.5 mt-1 justify-center sm:justify-start">
          {[
            targetAgent.faction,
            targetAgent.attribute,
            targetAgent.specialty,
            `${targetAgent.rank}-Rank`,
            targetAgent.gender,
            `v${targetAgent.release_version}`,
          ].map((attr) => (
            <span
              key={attr}
              className="px-2 py-0.5 rounded-md text-[11px] bg-zinc-800/80 text-zinc-400 border border-zinc-700/40"
            >
              {attr}
            </span>
          ))}
        </div>

        <div className="flex gap-2 mt-3 justify-center sm:justify-start">
          <button
            onClick={onNext}
            className="px-6 py-2 rounded-lg text-sm font-bold bg-yellow-500 text-black hover:bg-yellow-400 transition-colors"
          >
            Next agent →
          </button>
        </div>
        <p className="text-zinc-600 text-[10px] mt-1">Press Enter for the next agent</p>
      </div>
    </div>
  )
}
