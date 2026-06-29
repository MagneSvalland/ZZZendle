'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Image from 'next/image'
import type { Agent, GameState, GuessComparison, StreakData } from '@/lib/types'
import { compareAgents } from '@/lib/gameLogic'
import { getAgentForMode, getRecentAgentIds } from '@/lib/getAgentOfTheDay'
import { useDevAuth } from '@/contexts/DevAuthContext'
import { loadStats, recordResult, getPuzzleNumber, buildShareText, defaultStats, type StatsData } from '@/lib/stats'
import { getEffectiveDate } from '@/lib/date'
import SocialLinks from './SocialLinks'
import agentsRaw from '@/data/agents.json'
import SearchInput from './SearchInput'
import GuessRow from './GuessRow'
import ModeNav from './ModeNav'
import DailyCountdown from './DailyCountdown'
import ZZZdleLogo from './ZZZdleLogo'
import StatsModal from './StatsModal'

const allAgents = agentsRaw as Agent[]

function getTodayStr(): string {
  return new Date().toLocaleDateString('en-CA')
}

function getYesterdayStr(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toLocaleDateString('en-CA')
}

function getDefaultStreak(): StreakData {
  return { streak: 0, bestStreak: 0, lastWinDate: null }
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function Game() {
  const { isDevAuth } = useDevAuth()
  const [todayStr, setTodayStr] = useState<string | null>(null)
  const [targetAgent, setTargetAgent] = useState<Agent | null | undefined>(undefined)
  const [yesterdayAgent, setYesterdayAgent] = useState<Agent | null>(null)
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
    setYesterdayAgent(getAgentForMode('classic', getYesterdayStr()))

    const debugId = localStorage.getItem('zzzendle-debug-agent-classic')
    const gk = debugId ? 'zzzendle-debug-classic-game' : `zzzendle-game-${today}`
    gameKeyRef.current = gk

    if (debugId) {
      setIsDebug(true)
      setTargetAgent(allAgents.find(a => a.id === debugId) ?? null)
    } else {
      setTargetAgent(getAgentForMode('classic', today))
    }

    try {
      const savedGame = localStorage.getItem(gk)
      if (savedGame) {
        const state: GameState = JSON.parse(savedGame)
        setGuesses(state.guesses)
        setStatus(state.status)
      }
      const savedStreak = localStorage.getItem('zzzendle-streak')
      if (savedStreak) setStreakData(JSON.parse(savedStreak))
      setStats(loadStats('classic'))
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (!todayStr || targetAgent === undefined || !gameKeyRef.current) return
    const state: GameState = { date: todayStr, guesses, status }
    localStorage.setItem(gameKeyRef.current, JSON.stringify(state))
  }, [guesses, status, todayStr, targetAgent])

  function updateStreak(won: boolean, currentStreak: StreakData, today: string) {
    if (isDebug) return
    let updated: StreakData
    if (won) {
      const prev = new Date(today)
      prev.setDate(prev.getDate() - 1)
      const prevStr = prev.toLocaleDateString('en-CA')
      const newStreak = currentStreak.lastWinDate === prevStr ? currentStreak.streak + 1 : 1
      updated = {
        streak: newStreak,
        bestStreak: Math.max(currentStreak.bestStreak, newStreak),
        lastWinDate: today,
      }
    } else {
      updated = { ...currentStreak, streak: 0 }
    }
    setStreakData(updated)
    localStorage.setItem('zzzendle-streak', JSON.stringify(updated))
  }

  function handleGuess(agentId: string) {
    if (status !== 'playing' || !targetAgent || !todayStr) return
    if (guesses.includes(agentId)) return
    const newGuesses = [...guesses, agentId]
    setGuesses(newGuesses)

    if (agentId === targetAgent.id) {
      setStatus('won')
      updateStreak(true, streakData, todayStr)
      if (!isDebug && !statsRecordedRef.current) {
        statsRecordedRef.current = true
        setStats(recordResult('classic', true, newGuesses.length))
      }
    }
  }

  function handleDebug() {
    const recentIds = getRecentAgentIds(20)
    const eligible = allAgents.filter(a => !recentIds.has(a.id))
    const pool = eligible.length > 0 ? eligible : allAgents
    const pick = pool[Math.floor(Math.random() * pool.length)]
    localStorage.setItem('zzzendle-debug-agent-classic', pick.id)
    localStorage.removeItem('zzzendle-debug-classic-game')
    window.location.reload()
  }

  const relatedAgents = useMemo(() => {
    if (status === 'playing' || !targetAgent) return null
    return {
      faction: shuffle(allAgents.filter(a => a.id !== targetAgent.id && a.faction === targetAgent.faction)).slice(0, 4),
      attribute: shuffle(allAgents.filter(a => a.id !== targetAgent.id && a.attribute === targetAgent.attribute)).slice(0, 4),
      specialty: shuffle(allAgents.filter(a => a.id !== targetAgent.id && a.specialty === targetAgent.specialty)).slice(0, 4),
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, targetAgent])

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
        <p className="text-zinc-400 text-center">
          No agent scheduled for today ({todayStr}).
          <br />
          Add an entry to <code className="text-yellow-400">data/schedule.json</code> to continue.
        </p>
      </div>
    )
  }

  const comparisons: GuessComparison[] = guesses.map((id) => {
    const agent = allAgents.find((a) => a.id === id)!
    return compareAgents(agent, targetAgent)
  })

  const isOver = status !== 'playing'
  const puzzleNumber = todayStr ? getPuzzleNumber(todayStr) : 1
  const shareText = isOver
    ? buildShareText({ mode: 'classic', puzzleNumber, status: status as 'won' | 'lost', guessCount: guesses.length, comparisons })
    : undefined

  return (
    <div className="min-h-screen flex items-start justify-center px-4 py-8 sm:py-12">
      <div className="
        w-full max-w-5xl flex flex-col gap-6
        rounded-2xl border border-yellow-500/10
        bg-white/[0.018] backdrop-blur-sm
        shadow-[0_0_60px_rgba(250,204,21,0.04),0_0_120px_rgba(163,230,53,0.02)]
        p-6 sm:p-8
      ">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <ZZZdleLogo zSize="text-3xl sm:text-4xl" dleSize="text-3xl sm:text-4xl" />
            {todayStr && (
              <p className="text-xs text-zinc-400 mt-1">{formatDate(todayStr)}</p>
            )}
            {yesterdayAgent && (
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Yesterday: <span className="text-zinc-400 font-medium">{yesterdayAgent.name}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <DailyCountdown />
            <div className="w-px h-8 bg-zinc-800" />
            <div className="text-right">
              <div className="text-xl font-bold text-amber-400">{streakData.streak}</div>
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Streak</div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-zinc-300">{guesses.length}</div>
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Guesses</div>
            </div>
            <div className="w-px h-8 bg-zinc-800" />
            <button
              onClick={() => setStatsOpen(true)}
              className="text-zinc-500 hover:text-zinc-200 transition-colors text-xl leading-none"
              title="Statistics"
            >
              📊
            </button>
          </div>
        </div>

        {/* Mode navigation */}
        <ModeNav />

        <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-700/60 to-transparent" />

        {/* Prompt */}
        {!isOver && (
          <div className="text-center">
            <p className="text-zinc-300 text-sm">
              Guess today&apos;s{' '}
              <span className="text-yellow-400 font-semibold">Zenless Zone Zero</span> agent
            </p>
          </div>
        )}

        {/* Search input */}
        {!isOver && (
          <SearchInput
            agents={allAgents}
            guessedIds={guesses}
            disabled={isOver}
            onGuess={handleGuess}
          />
        )}

        {/* Win / Loss panel */}
        {isOver && (
          <ResultPanel
            targetAgent={targetAgent}
            status={status}
            guessCount={guesses.length}
            streak={streakData.streak}
            shareText={shareText}
            onOpenStats={() => setStatsOpen(true)}
          />
        )}

        {/* Related agents */}
        {isOver && relatedAgents && (
          <RelatedAgentsPanel targetAgent={targetAgent} related={relatedAgents} />
        )}

        {/* Guess history */}
        {comparisons.length > 0 && (
          <div className="w-full">
            <div className="flex items-center gap-3 px-3 mb-2">
              <div className="min-w-[130px] text-[10px] text-zinc-400 uppercase tracking-wider">Agent</div>
              <div className="flex flex-1 gap-2">
                {['Faction', 'Element', 'Specialty', 'Attack', 'Rarity', 'Gender'].map((h) => (
                  <div key={h} className="flex-1 text-[10px] text-zinc-400 uppercase tracking-wider text-center">{h}</div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {[...comparisons].reverse().map((c, i) => (
                <GuessRow key={c.agent.id} comparison={c} guessNumber={comparisons.length - i} />
              ))}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex gap-5 text-xs text-zinc-400 justify-center sm:justify-start">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-yellow-500 inline-block shadow-[0_0_6px_rgba(250,204,21,0.6)]" />
            Exact match
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-lime-500 inline-block shadow-[0_0_6px_rgba(163,230,53,0.5)]" />
            Partial match
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-zinc-800 border border-zinc-700/50 inline-block" />
            No match
          </span>
        </div>

        {/* Stats modal */}
        {statsOpen && (
          <StatsModal
            mode="classic"
            stats={stats}
            streakData={streakData}
            shareText={shareText}
            onClose={() => setStatsOpen(false)}
          />
        )}

        <SocialLinks />

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

function ResultPanel({
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
      className={`w-full rounded-xl border p-6 flex flex-col sm:flex-row items-center gap-6 ${
        won
          ? 'border-yellow-500/30 bg-yellow-950/10 shadow-[0_0_30px_rgba(250,204,21,0.05)]'
          : 'border-red-500/35 bg-red-950/15'
      }`}
    >
      <div className="relative w-28 h-28 rounded-xl overflow-hidden bg-zinc-900 shrink-0 border border-zinc-700/40">
        <span className="absolute inset-0 flex items-center justify-center text-2xl font-black text-zinc-700 select-none">
          {targetAgent.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
        </span>
        {(targetAgent.icon_image ?? targetAgent.splash_image) && (
          <Image
            src={(targetAgent.icon_image ?? targetAgent.splash_image)!}
            alt={targetAgent.name}
            fill
            className="object-cover object-top"
            sizes="112px"
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).style.display = 'none'
            }}
          />
        )}
      </div>

      <div className="flex flex-col gap-2 text-center sm:text-left">
        {won ? (
          <>
            <div className="text-yellow-300 font-black text-xl tracking-tight">
              {guessCount === 1 ? 'Incredible! First try!' : guessCount <= 3 ? 'Nice work!' : 'Got it!'}
            </div>
            <div className="text-zinc-300 text-sm">
              You guessed{' '}
              <span className="text-white font-semibold">{targetAgent.name}</span> in{' '}
              <span className="text-yellow-400 font-semibold">{guessCount}</span>{' '}
              {guessCount === 1 ? 'guess' : 'guesses'}!
            </div>
            {streak > 1 && (
              <div className="text-amber-400 text-sm font-semibold">{streak}-day streak! 🔥</div>
            )}
          </>
        ) : (
          <>
            <div className="text-red-400 font-black text-xl tracking-tight">Better luck tomorrow</div>
            <div className="text-zinc-400 text-sm">
              Today&apos;s agent was{' '}
              <span className="text-white font-semibold">{targetAgent.name}</span>
            </div>
          </>
        )}

        <div className="flex flex-wrap gap-1.5 mt-1 justify-center sm:justify-start">
          {[
            targetAgent.faction,
            targetAgent.attribute,
            targetAgent.specialty,
            targetAgent.attack_type,
            `${targetAgent.rank}-Rank`,
            targetAgent.gender,
          ].map((attr) => (
            <span
              key={attr}
              className="px-2 py-0.5 rounded-md text-[11px] bg-zinc-800/80 text-zinc-400 border border-zinc-700/40"
            >
              {attr}
            </span>
          ))}
        </div>

        <p className="text-zinc-400 text-xs mt-1">Come back tomorrow for the next agent!</p>
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleShare}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
              copied ? 'bg-green-600 text-white' : 'bg-yellow-500 text-black hover:bg-yellow-400'
            }`}
          >
            {copied ? '✓ Copied!' : 'Share'}
          </button>
          <button
            onClick={onOpenStats}
            className="px-4 py-1.5 rounded-lg text-sm border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors"
          >
            📊 Stats
          </button>
        </div>
      </div>
    </div>
  )
}

function RelatedAgentsPanel({
  targetAgent,
  related,
}: {
  targetAgent: Agent
  related: { faction: Agent[]; attribute: Agent[]; specialty: Agent[] }
}) {
  const sections = [
    { label: `Other ${targetAgent.faction}`, agents: related.faction },
    { label: `Other ${targetAgent.attribute} agents`, agents: related.attribute },
    { label: `Other ${targetAgent.specialty} agents`, agents: related.specialty },
  ].filter(s => s.agents.length > 0)

  if (sections.length === 0) return null

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="text-[10px] text-zinc-400 uppercase tracking-wider px-1">Related agents</div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {sections.map(({ label, agents }) => (
          <div key={label} className="bg-zinc-900/50 rounded-xl border border-zinc-800/60 p-3.5">
            <div className="text-[11px] text-yellow-500/80 font-semibold mb-3 uppercase tracking-wide">{label}</div>
            <div className="flex flex-col gap-2">
              {agents.map(agent => (
                <div key={agent.id} className="flex items-center gap-2.5">
                  <div className="relative w-7 h-7 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700/50 shrink-0">
                    <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-zinc-500">
                      {agent.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </span>
                    {(agent.icon_image ?? agent.splash_image) && (
                      <Image
                        src={(agent.icon_image ?? agent.splash_image)!}
                        alt={agent.name}
                        fill
                        className="object-cover object-top"
                        sizes="28px"
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                      />
                    )}
                  </div>
                  <span className="text-xs text-zinc-300 truncate">{agent.name}</span>
                  <span className="ml-auto text-[10px] text-zinc-600 shrink-0">{agent.rank}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
