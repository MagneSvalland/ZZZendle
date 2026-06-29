'use client'

import { useState, useEffect, useMemo } from 'react'
import agentsData from '@/data/agents.json'
import scheduleData from '@/data/schedule.json'
import type { Agent } from '@/lib/types'
import { useDevAuth } from '@/contexts/DevAuthContext'

const agents = agentsData as Agent[]
const schedule = scheduleData as Record<string, string>

export type SplashDayConfig = { portrait: string; focus: number }
export type SplashConfig = Record<string, SplashDayConfig>
export const SPLASH_CONFIG_KEY = 'zzzendle-splash-config'
export const SPLASH_SCHEDULE_EXT_KEY = 'zzzendle-schedule-ext-splash'

function getUpcomingBaseDays(count: number) {
  const days: { dateStr: string; agent: Agent; isToday: boolean }[] = []
  for (let i = 0; i < count; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const dateStr = d.toLocaleDateString('en-CA')
    const agentId = schedule[dateStr]
    const agent = agents.find(a => a.id === agentId)
    if (agent) days.push({ dateStr, agent, isToday: i === 0 })
  }
  return days
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return d.toLocaleDateString('en-CA')
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

function allPortraits(agent: Agent): string[] {
  return [agent.splash_image, ...(agent.alt_splash_images ?? [])].filter((s): s is string => !!s)
}

function defaultFocusFor(agent: Agent): number {
  return parseInt(agent.splash_focus?.match(/(\d+)/)?.[1] ?? '65')
}

// ── Day card ───────────────────────────────────────────────────────────────
function DayCard({
  dateStr,
  agent,
  isToday,
  label,
  config,
  onPortrait,
  onFocus,
  onClear,
  onRemove,
}: {
  dateStr: string
  agent: Agent
  isToday?: boolean
  label?: string
  config: SplashConfig
  onPortrait: (dateStr: string, portrait: string, agent: Agent) => void
  onFocus: (dateStr: string, focus: number, agent: Agent) => void
  onClear: (dateStr: string) => void
  onRemove?: (dateStr: string) => void
}) {
  const portraits = allPortraits(agent)
  const saved = config[dateStr]
  const selectedPortrait = (saved?.portrait && portraits.includes(saved.portrait)) ? saved.portrait : null
  const focusPct = saved?.focus ?? defaultFocusFor(agent)
  const previewSrc = selectedPortrait ?? portraits[0] ?? null

  return (
    <div className={`rounded-xl border p-4 flex gap-4 items-start ${
      saved
        ? isToday
          ? 'border-yellow-500/40 bg-yellow-950/12'
          : 'border-yellow-500/20 bg-yellow-950/8'
        : onRemove
          ? 'border-blue-500/20 bg-blue-950/10'
          : 'border-zinc-800 bg-zinc-900/30'
    }`}>
      <div className="w-32 shrink-0 pt-0.5">
        <div className={`text-[10px] font-bold uppercase tracking-widest ${
          isToday ? 'text-yellow-400' : onRemove ? 'text-blue-400' : 'text-zinc-500'
        }`}>
          {label ?? (isToday ? 'Today' : fmtDate(dateStr))}
        </div>
        <div className="text-sm font-semibold text-white mt-0.5 leading-tight">{agent.name}</div>
        <div className="text-[9px] text-zinc-600 mt-0.5">{agent.rank} · {agent.attribute}</div>
        <div className="mt-2 flex flex-col gap-1">
          {saved ? (
            <button onClick={() => onClear(dateStr)} className="text-[9px] text-zinc-600 hover:text-red-400 transition-colors text-left">
              ✕ clear config
            </button>
          ) : (
            <span className="text-[9px] text-zinc-700 italic">auto-detect</span>
          )}
          {onRemove && (
            <button onClick={() => onRemove(dateStr)} className="text-[9px] text-zinc-700 hover:text-red-400 transition-colors text-left">
              ✕ remove day
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 flex-1 min-w-0">
        {portraits.length === 0 ? (
          <span className="text-[10px] text-red-400">No portrait available</span>
        ) : (
          <>
            <div className="flex gap-2 flex-wrap">
              {portraits.map((src, i) => {
                const isActive = selectedPortrait === src
                return (
                  <button
                    key={src}
                    type="button"
                    onClick={() => onPortrait(dateStr, src, agent)}
                    title={i === 0 ? 'Default portrait' : `Skin ${i}`}
                    className={`relative w-12 aspect-[5/8] rounded overflow-hidden border-2 transition-all duration-150 ${
                      isActive
                        ? 'border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]'
                        : 'border-zinc-700 hover:border-zinc-400 opacity-70 hover:opacity-100'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="w-full h-full object-cover object-top" />
                    {i > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 text-[6px] text-center bg-yellow-500/85 text-black font-bold py-0.5 leading-tight">
                        SKIN
                      </div>
                    )}
                    {isActive && (
                      <div className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-yellow-400 flex items-center justify-center">
                        <span className="text-[6px] text-black font-black">✓</span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[9px] text-zinc-600 uppercase tracking-wider shrink-0 w-12">Focus Y</span>
              <input
                type="range"
                min={25}
                max={90}
                value={focusPct}
                onChange={e => onFocus(dateStr, parseInt(e.target.value), agent)}
                className="flex-1 accent-yellow-400 cursor-pointer"
              />
              <span className="text-[10px] text-zinc-400 w-8 text-right shrink-0">{focusPct}%</span>
            </div>
          </>
        )}
      </div>

      {previewSrc && (
        <div className="shrink-0 flex flex-col gap-1 items-center">
          <div className="text-[8px] text-zinc-700 uppercase tracking-wider">Preview</div>
          <div
            className="w-24 h-24 rounded-lg overflow-hidden border border-zinc-700/50"
            style={{
              backgroundImage: `url(${previewSrc})`,
              backgroundSize: '400%',
              backgroundPosition: `center ${focusPct}%`,
              backgroundRepeat: 'no-repeat',
            }}
          />
        </div>
      )}
    </div>
  )
}

// ── Agent picker modal ─────────────────────────────────────────────────────
function AgentPicker({
  onPick,
  onClose,
  usedIds,
}: {
  onPick: (agentId: string) => void
  onClose: () => void
  usedIds: Set<string>
}) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return agents.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.attribute.toLowerCase().includes(q) ||
      a.faction.toLowerCase().includes(q)
    )
  }, [search])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-zinc-900 border border-zinc-700/60 rounded-2xl p-5 w-full max-w-2xl flex flex-col gap-4 shadow-2xl max-h-[80vh]">
        <div className="flex items-center justify-between shrink-0">
          <div>
            <div className="text-sm font-semibold text-white">Pick an agent</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Will be added as the next scheduled splash day</div>
          </div>
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-300 text-lg transition-colors">✕</button>
        </div>

        <input
          type="text"
          value={search}
          autoFocus
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name, attribute, faction…"
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white outline-none focus:border-yellow-500/60 placeholder-zinc-600 shrink-0"
        />

        <div className="overflow-y-auto grid grid-cols-4 sm:grid-cols-6 gap-2 pr-1">
          {filtered.map(agent => {
            const iconSrc = agent.icon_image ?? agent.splash_image
            const alreadyUsed = usedIds.has(agent.id)
            return (
              <button
                key={agent.id}
                type="button"
                onClick={() => !alreadyUsed && onPick(agent.id)}
                title={agent.name}
                className={`flex flex-col items-center gap-1 rounded-xl border p-2 transition-all ${
                  alreadyUsed
                    ? 'border-zinc-800 opacity-30 cursor-not-allowed'
                    : 'border-zinc-700/50 hover:border-yellow-400/60 hover:bg-yellow-950/10 cursor-pointer'
                }`}
              >
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700/40 shrink-0">
                  {iconSrc
                    ? /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={iconSrc} alt="" className="w-full h-full object-cover object-top" />
                    : <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-600 font-bold">
                        {agent.name.slice(0, 2)}
                      </div>
                  }
                </div>
                <div className="text-[9px] text-zinc-300 text-center leading-tight line-clamp-2">{agent.name}</div>
                <div className="text-[8px] text-zinc-600 text-center">{agent.attribute}</div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export default function SplashConfigurator() {
  const { isDevAuth } = useDevAuth()
  const [config, setConfig] = useState<SplashConfig>({})
  const [ext, setExt] = useState<Record<string, string>>({})
  const [showPicker, setShowPicker] = useState(false)

  const baseDays = getUpcomingBaseDays(14)

  useEffect(() => {
    try {
      const savedCfg = localStorage.getItem(SPLASH_CONFIG_KEY)
      if (savedCfg) setConfig(JSON.parse(savedCfg))
      const savedExt = localStorage.getItem(SPLASH_SCHEDULE_EXT_KEY)
      if (savedExt) setExt(JSON.parse(savedExt))
    } catch { /* ignore */ }
  }, [])

  function persistConfig(next: SplashConfig) {
    setConfig(next)
    localStorage.setItem(SPLASH_CONFIG_KEY, JSON.stringify(next))
  }

  function persistExt(next: Record<string, string>) {
    setExt(next)
    localStorage.setItem(SPLASH_SCHEDULE_EXT_KEY, JSON.stringify(next))
  }

  function pickPortrait(dateStr: string, portrait: string, agent: Agent) {
    const prev = config[dateStr]
    persistConfig({ ...config, [dateStr]: { portrait, focus: prev?.focus ?? defaultFocusFor(agent) } })
  }

  function pickFocus(dateStr: string, focus: number, agent: Agent) {
    const prev = config[dateStr]
    const portraits = allPortraits(agent)
    persistConfig({ ...config, [dateStr]: { portrait: prev?.portrait ?? portraits[0] ?? '', focus } })
  }

  function clearDay(dateStr: string) {
    const { [dateStr]: _, ...rest } = config
    persistConfig(rest)
  }

  function removeExtDay(dateStr: string) {
    const { [dateStr]: _, ...rest } = ext
    persistExt(rest)
    clearDay(dateStr)
  }

  function addAgent(agentId: string) {
    const baseDates = Object.keys(schedule).sort()
    const extDates = Object.keys(ext).sort()
    const allDates = [...new Set([...baseDates, ...extDates])].sort()
    const lastDate = allDates[allDates.length - 1] ?? new Date().toLocaleDateString('en-CA')
    const nextDate = addDays(lastDate, 1)
    persistExt({ ...ext, [nextDate]: agentId })
    setShowPicker(false)
  }

  const extDays = Object.entries(ext)
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([dateStr, agentId]) => {
      const agent = agents.find(a => a.id === agentId)
      return agent ? [{ dateStr, agent }] : []
    })

  const extUsedIds = new Set(Object.values(ext))

  const cardProps = { config, onPortrait: pickPortrait, onFocus: pickFocus, onClear: clearDay }

  if (!isDevAuth) {
    return (
      <section>
        <h2 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-4">
          Splash Art Config
        </h2>
        <p className="text-zinc-700 text-sm">Log in as developer (bottom-right button) to configure splash art.</p>
      </section>
    )
  }

  function clearAll() {
    persistConfig({})
    persistExt({})
  }

  const hasAny = Object.keys(config).length > 0 || Object.keys(ext).length > 0

  return (
    <section>
      <div className="flex items-center gap-4 mb-1">
        <h2 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">
          Splash Art Config
        </h2>
        {hasAny && (
          <button
            onClick={clearAll}
            className="text-[10px] text-zinc-700 hover:text-red-400 transition-colors"
          >
            ✕ clear all
          </button>
        )}
      </div>
      <p className="text-[10px] text-zinc-700 mb-5">
        Click a portrait to select it. Drag Focus Y to control zoom position. Leave unconfigured to use auto skin-detection.
      </p>

      <div className="flex flex-col gap-3">

        {baseDays.length > 0 && (
          <>
            <div className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold px-1">
              Scheduled — next {baseDays.length} days
            </div>
            {baseDays.map(({ dateStr, agent, isToday }) => (
              <DayCard key={dateStr} dateStr={dateStr} agent={agent} isToday={isToday} {...cardProps} />
            ))}
          </>
        )}

        {extDays.length > 0 && (
          <>
            <div className="text-[10px] text-blue-500/70 uppercase tracking-widest font-semibold px-1 mt-2">
              Extended — {extDays.length} added {extDays.length === 1 ? 'day' : 'days'}
            </div>
            {extDays.map(({ dateStr, agent }) => (
              <DayCard
                key={dateStr}
                dateStr={dateStr}
                agent={agent}
                label={fmtDate(dateStr)}
                onRemove={removeExtDay}
                {...cardProps}
              />
            ))}
          </>
        )}

        <button
          type="button"
          onClick={() => setShowPicker(true)}
          className="mt-2 self-start flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-zinc-600 text-zinc-400 text-sm hover:border-yellow-500/50 hover:text-yellow-400 transition-all duration-150"
        >
          <span className="text-base font-bold leading-none">+</span>
          <span>Add day</span>
        </button>

      </div>

      {showPicker && (
        <AgentPicker
          onPick={addAgent}
          onClose={() => setShowPicker(false)}
          usedIds={extUsedIds}
        />
      )}
    </section>
  )
}
