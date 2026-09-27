'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import type { Agent, GameState, StreakData } from '@/lib/types'
import { getAgentForMode, getRecentAgentIds } from '@/lib/getAgentOfTheDay'
import { useDevAuth } from '@/contexts/DevAuthContext'
import { loadStats, recordResult, getPuzzleNumber, buildShareText, computeNextStreak, defaultStats, type StatsData } from '@/lib/stats'
import { getEffectiveDate } from '@/lib/date'
import SocialLinks from './SocialLinks'
import { SPLASH_SCHEDULE_EXT_KEY } from './SplashConfigurator'
import ZZZdleLogo from './ZZZdleLogo'
import StatsModal from './StatsModal'
import DailyCountdown from './DailyCountdown'
import agentsRaw from '@/data/agents.json'
import SearchInput from './SearchInput'
import ModeNav from './ModeNav'
import { KOFI_URL } from './KofiBanner'

const allAgents = agentsRaw as Agent[]

export interface RenderChallengeProps {
  wrongGuesses: number
  targetAgent: Agent
  isOver: boolean
  status: 'playing' | 'won' | 'lost'
}

interface Props {
  mode: string
  renderChallenge: (props: RenderChallengeProps) => React.ReactNode
  getHints: (targetAgent: Agent) => string[]
  credit?: React.ReactNode
}

function getDefaultStreak(): StreakData {
  return { streak: 0, bestStreak: 0, lastWinDate: null }
}

export default function GenericModeGame({
  mode,
  renderChallenge,
  getHints,
  credit,
}: Props) {
  const { isDevAuth } = useDevAuth()
  const streakKey = `zzzendle-${mode}-streak`

  const [todayStr, setTodayStr] = useState<string | null>(null)
  const [targetAgent, setTargetAgent] = useState<Agent | null | undefined>(undefined)
  const [guesses, setGuesses] = useState<string[]>([])
  const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing')
  const [streakData, setStreakData] = useState<StreakData>(getDefaultStreak())
  const [stats, setStats] = useState<StatsData>(defaultStats())
  const [statsOpen, setStatsOpen] = useState(false)
  const [isDebug, setIsDebug] = useState(false)
  const gameKeyRef = useRef<string>('')
  const statsRecordedRef = useRef(false)

  useEffect(() => {
    const today = getEffectiveDate()
    setTodayStr(today)

    const debugId = localStorage.getItem(`zzzendle-debug-agent-${mode}`)
    const gk = debugId ? `zzzendle-debug-${mode}-game` : `zzzendle-${mode}-game-${today}`
    gameKeyRef.current = gk

    if (debugId) {
      setIsDebug(true)
      setTargetAgent(allAgents.find(a => a.id === debugId) ?? null)
    } else {
      let agent: Agent | null = null
      if (mode === 'splash') {
        // User-configured extension takes priority over seeded pick
        try {
          const ext: Record<string, string> = JSON.parse(localStorage.getItem(SPLASH_SCHEDULE_EXT_KEY) ?? '{}')
          const extId = ext[today]
          if (extId) agent = allAgents.find(a => a.id === extId) ?? null
        } catch { /* ignore */ }
      }
      if (!agent) agent = getAgentForMode(mode, today)
      setTargetAgent(agent)
    }

    try {
      const saved = localStorage.getItem(gk)
      if (saved) {
        const state: GameState = JSON.parse(saved)
        setGuesses(state.guesses)
        setStatus(state.status)
      }
      const savedStreak = localStorage.getItem(streakKey)
      if (savedStreak) setStreakData(JSON.parse(savedStreak))
      setStats(loadStats(mode))
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  useEffect(() => {
    if (!todayStr || targetAgent === undefined || !gameKeyRef.current) return
    localStorage.setItem(gameKeyRef.current, JSON.stringify({ date: todayStr, guesses, status }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guesses, status, todayStr, targetAgent, mode])

  function updateStreak(won: boolean, today: string) {
    if (isDebug) return
    const updated = computeNextStreak(streakData, won, today)
    setStreakData(updated)
    localStorage.setItem(streakKey, JSON.stringify(updated))
  }

  function handleGuess(agentId: string) {
    if (status !== 'playing' || !targetAgent || !todayStr) return
    if (guesses.includes(agentId)) return

    const newGuesses = [...guesses, agentId]
    setGuesses(newGuesses)

    if (agentId === targetAgent.id) {
      setStatus('won')
      updateStreak(true, todayStr)
      if (!isDebug && !statsRecordedRef.current) {
        statsRecordedRef.current = true
        setStats(recordResult(mode, true, newGuesses.length))
      }
      window.dispatchEvent(new CustomEvent('zzzendle-mode-complete'))
    }
  }

  function handleDebug() {
    const recentIds = getRecentAgentIds(20)
    const eligible = allAgents.filter(a => !recentIds.has(a.id))
    const pool = eligible.length > 0 ? eligible : allAgents
    const pick = pool[Math.floor(Math.random() * pool.length)]
    localStorage.setItem(`zzzendle-debug-agent-${mode}`, pick.id)
    localStorage.removeItem(`zzzendle-debug-${mode}-game`)
    window.location.reload()
  }

  if (targetAgent === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-zinc-500 text-sm animate-pulse">Loading…</div>
      </div>
    )
  }

  if (targetAgent === null) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
        <ZZZdleLogo />
        <p className="text-zinc-400 text-center">
          No agent scheduled for today ({todayStr}).
        </p>
      </div>
    )
  }

  const wrongGuesses = guesses.filter((id) => id !== targetAgent.id).length
  const isOver = status !== 'playing'
  const hints = getHints(targetAgent)
  const revealedHints = hints.slice(0, wrongGuesses)
  const puzzleNumber = todayStr ? getPuzzleNumber(todayStr) : 1
  const shareText = isOver
    ? buildShareText({ mode, puzzleNumber, status: status as 'won' | 'lost', guessCount: guesses.length, stats, streak: streakData.streak, bestStreak: streakData.bestStreak })
    : undefined

  return (
    <div className="flex-1 flex items-start justify-center px-4 py-8 sm:py-12">
      <div className="
        w-full max-w-5xl flex flex-col gap-5
        rounded-2xl border border-yellow-500/10
        bg-white/[0.018] backdrop-blur-sm
        shadow-[0_0_60px_rgba(250,204,21,0.04),0_0_120px_rgba(163,230,53,0.02)]
        p-4 sm:p-8
      ">
        {/* Header */}
        <div className="flex items-center justify-between">
          <ZZZdleLogo zSize="text-3xl sm:text-4xl" dleSize="text-3xl sm:text-4xl" />
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:block"><DailyCountdown /></div>
            <div className="hidden sm:block w-px h-8 bg-zinc-800" />
            <div className="text-right">
              <div className="text-lg sm:text-xl font-bold text-amber-400">{streakData.streak}</div>
              <div className="text-[9px] sm:text-[10px] text-zinc-400 uppercase tracking-wider">Streak</div>
            </div>
            <div className="text-right">
              <div className="text-lg sm:text-xl font-bold text-zinc-300">{guesses.length}</div>
              <div className="text-[9px] sm:text-[10px] text-zinc-400 uppercase tracking-wider">Guesses</div>
            </div>
            <div className="w-px h-6 sm:h-8 bg-zinc-800" />
            <button
              onClick={() => setStatsOpen(true)}
              className="text-zinc-500 hover:text-zinc-200 transition-colors text-lg sm:text-xl leading-none"
              title="Statistics"
            >
              📊
            </button>
          </div>
        </div>

        {/* Mode navigation */}
        <ModeNav />

        <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-700/60 to-transparent" />

        {/* Challenge content */}
        <div className="w-full flex justify-center">
          {renderChallenge({ wrongGuesses, targetAgent, isOver, status })}
        </div>

        {/* Progressive hints */}
        {revealedHints.length > 0 && (
          <div className="w-full flex flex-col gap-2">
            {revealedHints.map((hint, i) => (
              <div
                key={i}
                className="hint-slide-in text-sm bg-zinc-900/60 rounded-xl px-4 py-2.5 border border-zinc-700/30 flex items-center gap-2.5"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <span className="text-yellow-500 text-[10px] font-bold tracking-widest uppercase shrink-0">
                  Hint {i + 1}
                </span>
                <span className="w-px h-3 bg-zinc-700 shrink-0" />
                <span className="text-zinc-300 text-sm">{hint}</span>
              </div>
            ))}
          </div>
        )}

        {/* Guess input */}
        {!isOver && (
          <div className="w-full flex flex-col items-center gap-2">
            <SearchInput
              agents={allAgents}
              guessedIds={guesses}
              disabled={false}
              onGuess={handleGuess}
            />
          </div>
        )}

        {/* Result panel */}
        {isOver && (
          <ModeResultPanel
            targetAgent={targetAgent}
            status={status}
            guessCount={guesses.length}
            streak={streakData.streak}
            shareText={shareText}
            onOpenStats={() => setStatsOpen(true)}
          />
        )}

        {/* Guess history */}
        {guesses.length > 0 && (
          <div className="w-full flex flex-col gap-2">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider px-1">
              Your guesses
            </div>
            {[...guesses].reverse().map((id, i) => {
              const agent = allAgents.find((a) => a.id === id)!
              const isCorrect = id === targetAgent.id
              return (
                <div
                  key={id}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-colors ${
                    isCorrect
                      ? 'border-yellow-500/30 bg-yellow-950/10 shadow-[0_0_12px_rgba(250,204,21,0.06)]'
                      : 'border-zinc-700/30 bg-zinc-900/40'
                  }`}
                >
                  <span className="text-zinc-400 text-xs w-4 shrink-0">
                    {guesses.length - i}.
                  </span>
                  <span className={`text-sm font-medium ${isCorrect ? 'text-yellow-300' : 'text-zinc-300'}`}>
                    {agent.name}
                  </span>
                  <span className="ml-auto text-base">{isCorrect ? '✅' : '❌'}</span>
                </div>
              )
            })}
          </div>
        )}

        {/* Stats modal */}
        {statsOpen && (
          <StatsModal
            mode={mode}
            stats={stats}
            streakData={streakData}
            shareText={shareText}
            onClose={() => setStatsOpen(false)}
          />
        )}

        <div className="flex items-center justify-between">
          {credit ?? <span />}
          <SocialLinks />
        </div>

        {/* Debug — only shown when logged in as dev */}
        {isDevAuth && (
          <div className="flex items-center justify-center gap-3 pt-1 border-t border-zinc-800/50">
            {isDebug && (
              <span className="text-[10px] text-yellow-600/70">
                debug: {targetAgent.name}
              </span>
            )}
            <button
              onClick={handleDebug}
              className="text-[10px] text-zinc-700 hover:text-zinc-400 transition-colors px-2.5 py-1 rounded border border-zinc-800/80 hover:border-zinc-600/60"
            >
              ⟳ Randomize
            </button>
            <a
              href="/debug"
              className="text-[10px] text-zinc-700 hover:text-zinc-400 transition-colors px-2.5 py-1 rounded border border-zinc-800/80 hover:border-zinc-600/60"
            >
              🖼 Images
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

function ModeResultPanel({
  targetAgent,
  status,
  guessCount,
  streak,
  shareText,
  onOpenStats,
}: {
  targetAgent: Agent
  status: 'won' | 'lost'
  guessCount: number
  streak: number
  shareText?: string
  onOpenStats: () => void
}) {
  const [copied, setCopied] = useState(false)
  const won = status === 'won'

  function handleShare() {
    if (!shareText) return
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div
      className={`w-full rounded-xl border p-5 flex items-center gap-5 ${
        won
          ? 'border-yellow-500/30 bg-yellow-950/10 shadow-[0_0_20px_rgba(250,204,21,0.07)]'
          : 'border-red-500/35 bg-red-950/15'
      }`}
    >
      <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-zinc-900 shrink-0 border border-zinc-700/40">
        <span className="absolute inset-0 flex items-center justify-center text-xl font-black text-zinc-400 select-none">
          {targetAgent.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
        </span>
        {(targetAgent.icon_image ?? targetAgent.splash_image) && (
          <Image
            src={(targetAgent.icon_image ?? targetAgent.splash_image)!}
            alt={targetAgent.name}
            fill
            className="object-cover object-top"
            sizes="80px"
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).style.display = 'none'
            }}
          />
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        {won ? (
          <>
            <div className="text-yellow-300 font-black text-lg leading-tight tracking-tight">
              {guessCount === 1 ? 'First try!' : guessCount <= 2 ? 'Impressive!' : 'Got it!'}
            </div>
            <div className="text-zinc-300 text-sm">
              <span className="text-white font-semibold">{targetAgent.name}</span>{' '}
              in{' '}
              <span className="text-yellow-400 font-semibold">{guessCount}</span>{' '}
              {guessCount === 1 ? 'guess' : 'guesses'}
            </div>
            {streak > 1 && (
              <div className="text-amber-400 text-sm font-semibold">{streak}-day streak! 🔥</div>
            )}
          </>
        ) : (
          <>
            <div className="text-red-400 font-black text-lg tracking-tight">Better luck tomorrow</div>
            <div className="text-zinc-400 text-sm">
              It was <span className="text-white font-semibold">{targetAgent.name}</span>
            </div>
          </>
        )}
        <p className="text-zinc-400 text-xs mt-0.5">Come back tomorrow!</p>
        <div className="flex gap-2 mt-2 flex-wrap">
          <button
            onClick={handleShare}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
              copied ? 'bg-green-600 text-white' : 'bg-yellow-500 text-black hover:bg-yellow-400'
            }`}
          >
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
          <button
            onClick={() => shareText && window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank')}
            className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-black border border-zinc-700 text-white hover:bg-zinc-900 transition-colors"
          >
            𝕏 Share
          </button>
          <button
            onClick={onOpenStats}
            className="px-4 py-1.5 rounded-lg text-sm border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors"
          >
            📊 Stats
          </button>
          {/* Only on a win — right after solving is the best-goodwill moment
              to ask, unlike a generic timed popup shown regardless of context. */}
          {won && (
            <a
              href={KOFI_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-1.5 rounded-lg text-sm border border-amber-500/40 text-amber-400 hover:border-amber-400 hover:text-amber-300 transition-colors"
            >
              ☕ Support on Ko-fi
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
