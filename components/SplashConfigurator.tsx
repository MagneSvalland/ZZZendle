'use client'

import { useState, useEffect, useMemo, type MouseEvent } from 'react'
import agentsData from '@/data/agents.json'
import scheduleData from '@/data/schedule.json'
import staticSplashConfig from '@/data/splash-config.json'
import type { Agent } from '@/lib/types'
import { useDevAuth } from '@/contexts/DevAuthContext'

const agents = agentsData as Agent[]
const schedule = scheduleData as Record<string, string>

// `focus` is the vertical position (kept unnamed for backwards compatibility
// with already-saved days); `focusX` is the horizontal position, optional so
// old entries without it still fall back to center (50%).
export type SplashDayConfig = { portrait: string; focus: number; focusX?: number }
export type SplashConfig = Record<string, SplashDayConfig>
const DEFAULT_FOCUS_X = 50
const FOCUS_MIN = 25
const FOCUS_MAX = 90
export const SPLASH_CONFIG_KEY = 'zzzendle-splash-config'
export const SPLASH_SCHEDULE_EXT_KEY = 'zzzendle-schedule-ext-splash'
export const SPLASH_PENDING_REMOVE_KEY = 'zzzendle-schedule-pending-remove'

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

// Re-index the extended days, preserving their order and per-day config, so
// each one lands on the next real open date from today onward — filling any
// gap left in schedule.json before continuing past the last scheduled day.
// Removing a day in the middle shifts the rest up so the queue stays packed
// into the earliest available slots.
function contiguousExt(
  extMap: Record<string, string>,
  configMap: SplashConfig,
): { ext: Record<string, string>; config: SplashConfig } {
  const today = new Date().toLocaleDateString('en-CA')
  const nextExt: Record<string, string> = {}
  const nextConfig: SplashConfig = {}
  // Keep configs that belong to scheduled (non-extended) days untouched.
  for (const [d, c] of Object.entries(configMap)) {
    if (extMap[d] === undefined) nextConfig[d] = c
  }
  let cursor = today
  Object.keys(extMap).sort().forEach((oldDate) => {
    do {
      cursor = addDays(cursor, 1)
    } while (schedule[cursor] !== undefined || nextExt[cursor] !== undefined)
    nextExt[cursor] = extMap[oldDate]
    if (configMap[oldDate]) nextConfig[cursor] = configMap[oldDate]
  })
  return { ext: nextExt, config: nextConfig }
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

function allPortraits(agent: Agent): string[] {
  return [agent.splash_image, ...(agent.alt_splash_images ?? [])].filter((s): s is string => !!s)
}

// Display name for a specific portrait: "Velina Airgid" for the default,
// "Velina Airgid (Shade of Leisure)" for a skin.
function portraitName(agent: Agent, src: string): string {
  const skinIdx = (agent.alt_splash_images ?? []).indexOf(src)
  if (skinIdx < 0) return agent.name
  const skinName = agent.alt_splash_names?.[skinIdx] ?? `Skin ${skinIdx + 1}`
  return `${agent.name} (${skinName})`
}

function isSkinPortrait(agent: Agent, src: string): boolean {
  return (agent.alt_splash_images ?? []).includes(src)
}

function defaultFocusFor(agent: Agent): number {
  return parseInt(agent.splash_focus?.match(/(\d+)/)?.[1] ?? '65')
}

// ── Day card ───────────────────────────────────────────────────────────────
function FocusMarker({ x, y }: { x: number; y: number }) {
  return (
    <div
      className="absolute w-2.5 h-2.5 -ml-[5px] -mt-[5px] rounded-full border-2 border-yellow-400 bg-yellow-400/40 shadow-[0_0_4px_rgba(250,204,21,0.9)] pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%` }}
    />
  )
}

function DayCard({
  dateStr,
  agent,
  isToday,
  label,
  config,
  onPick,
  onClear,
  onRemove,
  onRemoveSchedule,
  pendingRemoval,
}: {
  dateStr: string
  agent: Agent
  isToday?: boolean
  label?: string
  config: SplashConfig
  onPick: (dateStr: string, portrait: string, focusX: number, focusY: number, agent: Agent) => void
  onClear: (dateStr: string) => void
  onRemove?: (dateStr: string) => void
  onRemoveSchedule?: (dateStr: string) => void
  pendingRemoval?: boolean
}) {
  const portraits = allPortraits(agent)
  const saved = config[dateStr]
  const selectedPortrait = (saved?.portrait && portraits.includes(saved.portrait)) ? saved.portrait : null
  const focusYPct = saved?.focus ?? defaultFocusFor(agent)
  const focusXPct = saved?.focusX ?? DEFAULT_FOCUS_X
  const previewSrc = selectedPortrait ?? portraits[0] ?? null
  // Extended days (added via the picker) are locked to the single portrait you
  // picked — no switcher, so default and skins stay individual.
  const isExt = !!onRemove
  const lockedSrc = selectedPortrait ?? portraits[0] ?? null
  const headerName = isExt && lockedSrc ? portraitName(agent, lockedSrc) : agent.name

  // Clicking anywhere on a portrait thumbnail sets the zoom focus to that
  // point (clamped to the range that still looks good at 400%).
  function handlePortraitClick(e: MouseEvent<HTMLButtonElement>, src: string) {
    const rect = e.currentTarget.getBoundingClientRect()
    const relX = (e.clientX - rect.left) / rect.width
    const relY = (e.clientY - rect.top) / rect.height
    const clamp = (v: number) => Math.round(Math.min(FOCUS_MAX, Math.max(FOCUS_MIN, v * 100)))
    onPick(dateStr, src, clamp(relX), clamp(relY), agent)
  }

  return (
    <div className={`rounded-xl border p-4 flex gap-4 items-start ${
      pendingRemoval
        ? 'border-red-500/40 bg-red-950/15 opacity-60'
        : saved
          ? isToday
            ? 'border-yellow-500/40 bg-yellow-950/12'
            : 'border-yellow-500/20 bg-yellow-950/8'
          : onRemove
            ? 'border-blue-500/20 bg-blue-950/10'
            : 'border-zinc-800 bg-zinc-900/30'
    }`}>
      <div className="w-32 shrink-0 pt-0.5">
        <div className={`text-[10px] font-bold uppercase tracking-widest ${
          pendingRemoval ? 'text-red-400' : isToday ? 'text-yellow-400' : onRemove ? 'text-blue-400' : 'text-zinc-500'
        }`}>
          {label ?? (isToday ? 'Today' : fmtDate(dateStr))}
        </div>
        <div className="text-sm font-semibold text-white mt-0.5 leading-tight">{headerName}</div>
        <div className="text-[9px] text-zinc-600 mt-0.5">{agent.rank} · {agent.attribute}</div>
        <div className="mt-2 flex flex-col gap-1">
          {pendingRemoval ? (
            <button onClick={() => onRemoveSchedule!(dateStr)} className="text-[9px] text-red-400 hover:text-red-300 transition-colors text-left font-semibold">
              ↺ undo remove
            </button>
          ) : (
            <>
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
              {onRemoveSchedule && (
                <button onClick={() => onRemoveSchedule(dateStr)} className="text-[9px] text-zinc-700 hover:text-red-400 transition-colors text-left">
                  ✕ remove agent
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className={`flex flex-col gap-3 flex-1 min-w-0 ${pendingRemoval ? 'pointer-events-none' : ''}`}>
        {pendingRemoval ? (
          <span className="text-[10px] text-red-400">Will be removed from the schedule on next save &amp; deploy</span>
        ) : portraits.length === 0 ? (
          <span className="text-[10px] text-red-400">No portrait available</span>
        ) : (
          <>
            {isExt ? (
              // Locked to the one portrait picked for this day
              lockedSrc && (
                <button
                  type="button"
                  onClick={(e) => handlePortraitClick(e, lockedSrc)}
                  title="Click to set zoom focus"
                  className="relative w-12 aspect-[5/8] rounded overflow-hidden border-2 border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)] cursor-crosshair"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={lockedSrc} alt="" className="w-full h-full object-cover object-top pointer-events-none" />
                  {isSkinPortrait(agent, lockedSrc) && (
                    <div className="absolute bottom-0 left-0 right-0 text-[6px] text-center bg-yellow-500/85 text-black font-bold py-0.5 leading-tight">
                      SKIN
                    </div>
                  )}
                  <FocusMarker x={focusXPct} y={focusYPct} />
                </button>
              )
            ) : (
              <div className="flex gap-2 flex-wrap">
                {portraits.map((src) => {
                  const isActive = selectedPortrait === src
                  const skin = isSkinPortrait(agent, src)
                  return (
                    <button
                      key={src}
                      type="button"
                      onClick={(e) => handlePortraitClick(e, src)}
                      title={`${portraitName(agent, src)} — click to set zoom focus`}
                      className={`relative w-12 aspect-[5/8] rounded overflow-hidden border-2 transition-all duration-150 cursor-crosshair ${
                        isActive
                          ? 'border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]'
                          : 'border-zinc-700 hover:border-zinc-400 opacity-70 hover:opacity-100'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="w-full h-full object-cover object-top pointer-events-none" />
                      {skin && (
                        <div className="absolute bottom-0 left-0 right-0 text-[6px] text-center bg-yellow-500/85 text-black font-bold py-0.5 leading-tight">
                          SKIN
                        </div>
                      )}
                      {isActive && (
                        <div className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-yellow-400 flex items-center justify-center">
                          <span className="text-[6px] text-black font-black">✓</span>
                        </div>
                      )}
                      {isActive && <FocusMarker x={focusXPct} y={focusYPct} />}
                    </button>
                  )
                })}
              </div>
            )}

            <div className="text-[9px] text-zinc-600">
              Focus <span className="text-zinc-300 font-semibold">{focusXPct}%, {focusYPct}%</span>
              <span className="text-zinc-700"> — click the portrait to set</span>
            </div>
          </>
        )}
      </div>

      {previewSrc && !pendingRemoval && (
        <div className="shrink-0 flex flex-col gap-1 items-center">
          <div className="text-[8px] text-zinc-700 uppercase tracking-wider">Preview</div>
          <div
            className="w-24 h-24 rounded-lg overflow-hidden border border-zinc-700/50"
            style={{
              backgroundImage: `url(${previewSrc})`,
              backgroundSize: '400%',
              backgroundPosition: `${focusXPct}% ${focusYPct}%`,
              backgroundRepeat: 'no-repeat',
            }}
          />
        </div>
      )}
    </div>
  )
}

// ── Portrait options: default + each named skin as its own entry ─────────────
type PortraitOption = {
  agent: Agent
  portrait: string
  displayName: string
  isSkin: boolean
}

function expandPortraitOptions(): PortraitOption[] {
  const out: PortraitOption[] = []
  for (const agent of agents) {
    if (agent.splash_image) {
      out.push({ agent, portrait: agent.splash_image, displayName: agent.name, isSkin: false })
    }
    const skins = agent.alt_splash_images ?? []
    const names = agent.alt_splash_names ?? []
    skins.forEach((src, i) => {
      if (!src) return
      const skinName = names[i] ?? `Skin ${i + 1}`
      out.push({ agent, portrait: src, displayName: `${agent.name} (${skinName})`, isSkin: true })
    })
  }
  return out
}

const PORTRAIT_OPTIONS = expandPortraitOptions()

// ── Agent picker modal ─────────────────────────────────────────────────────
function AgentPicker({
  onPick,
  onClose,
  usedPortraits,
}: {
  onPick: (agentId: string, portrait: string) => void
  onClose: () => void
  usedPortraits: Set<string>
}) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return PORTRAIT_OPTIONS.filter(o =>
      o.displayName.toLowerCase().includes(q) ||
      o.agent.attribute.toLowerCase().includes(q) ||
      o.agent.faction.toLowerCase().includes(q)
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
            <div className="text-sm font-semibold text-white">Pick a portrait</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Default and each skin are separate entries — search the skin name for skins</div>
          </div>
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-300 text-lg transition-colors">✕</button>
        </div>

        <input
          type="text"
          value={search}
          autoFocus
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name, skin, attribute, faction…"
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white outline-none focus:border-yellow-500/60 placeholder-zinc-600 shrink-0"
        />

        <div className="overflow-y-auto grid grid-cols-4 sm:grid-cols-6 gap-2 pr-1">
          {filtered.map(opt => {
            const alreadyUsed = usedPortraits.has(opt.portrait)
            return (
              <button
                key={opt.portrait}
                type="button"
                onClick={() => !alreadyUsed && onPick(opt.agent.id, opt.portrait)}
                title={opt.displayName}
                className={`flex flex-col items-center gap-1 rounded-xl border p-2 transition-all ${
                  alreadyUsed
                    ? 'border-zinc-800 opacity-30 cursor-not-allowed'
                    : opt.isSkin
                      ? 'border-yellow-500/25 hover:border-yellow-400/70 hover:bg-yellow-950/10 cursor-pointer'
                      : 'border-zinc-700/50 hover:border-yellow-400/60 hover:bg-yellow-950/10 cursor-pointer'
                }`}
              >
                <div className="relative w-12 aspect-[5/8] rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700/40 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={opt.portrait} alt="" className="w-full h-full object-cover object-top" />
                  {opt.isSkin && (
                    <div className="absolute bottom-0 left-0 right-0 text-[6px] text-center bg-yellow-500/85 text-black font-bold py-0.5 leading-tight">
                      SKIN
                    </div>
                  )}
                </div>
                <div className="text-[9px] text-zinc-300 text-center leading-tight line-clamp-2">{opt.displayName}</div>
                <div className="text-[8px] text-zinc-600 text-center">{opt.agent.attribute}</div>
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
  const [pendingRemove, setPendingRemove] = useState<Set<string>>(new Set())
  const [showPicker, setShowPicker] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'done' | 'error'>('idle')
  const [saveError, setSaveError] = useState('')

  const baseDays = getUpcomingBaseDays(14)

  useEffect(() => {
    try {
      const cfgStr = localStorage.getItem(SPLASH_CONFIG_KEY)
      const extStr = localStorage.getItem(SPLASH_SCHEDULE_EXT_KEY)
      // Start from deployed file so sliders reflect what's actually live
      const base: SplashConfig = staticSplashConfig as SplashConfig
      const local: SplashConfig = cfgStr ? JSON.parse(cfgStr) : {}
      const cfg: SplashConfig = { ...base, ...local }
      const rawExt: Record<string, string> = extStr ? JSON.parse(extStr) : {}
      const norm = contiguousExt(rawExt, cfg)
      setConfig(norm.config)
      setExt(norm.ext)
      localStorage.setItem(SPLASH_CONFIG_KEY, JSON.stringify(norm.config))
      localStorage.setItem(SPLASH_SCHEDULE_EXT_KEY, JSON.stringify(norm.ext))

      const removeStr = localStorage.getItem(SPLASH_PENDING_REMOVE_KEY)
      const removeArr: string[] = removeStr ? JSON.parse(removeStr) : []
      setPendingRemove(new Set(removeArr))
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

  function persistPendingRemove(next: Set<string>) {
    setPendingRemove(next)
    localStorage.setItem(SPLASH_PENDING_REMOVE_KEY, JSON.stringify([...next]))
  }

  // A stale "✕ failed" / "✓ deployed!" banner from a previous save shouldn't
  // linger while you keep editing — clear it on the next edit you make.
  function resetSaveBanner() {
    setSaveState('idle')
    setSaveError('')
  }

  // Toggles whether an already-scheduled (base) day's agent is marked for
  // removal. Unlike ext days, base days live in the committed schedule.json,
  // so this only takes effect once "save & deploy" runs.
  function toggleRemoveBaseDay(dateStr: string) {
    resetSaveBanner()
    const next = new Set(pendingRemove)
    if (next.has(dateStr)) next.delete(dateStr)
    else next.add(dateStr)
    persistPendingRemove(next)
  }

  function pickPortraitFocus(dateStr: string, portrait: string, focusX: number, focusY: number) {
    resetSaveBanner()
    persistConfig({ ...config, [dateStr]: { portrait, focus: focusY, focusX } })
  }

  function clearDay(dateStr: string) {
    resetSaveBanner()
    const { [dateStr]: _, ...rest } = config
    persistConfig(rest)
  }

  function removeExtDay(dateStr: string) {
    resetSaveBanner()
    const restExt = { ...ext }
    const restConfig = { ...config }
    delete restExt[dateStr]
    delete restConfig[dateStr]
    // Re-index so the remaining days close the gap and stay sequential.
    const norm = contiguousExt(restExt, restConfig)
    persistExt(norm.ext)
    persistConfig(norm.config)
  }

  function addAgent(agentId: string, portrait: string) {
    resetSaveBanner()
    const agent = agents.find(a => a.id === agentId)
    const today = new Date().toLocaleDateString('en-CA')
    // Find the next real open date — filling a gap in schedule.json before
    // continuing past the last already-scheduled day.
    const existing = Object.keys(ext).sort()
    let sentinel = existing[existing.length - 1] ?? today
    do {
      sentinel = addDays(sentinel, 1)
    } while (schedule[sentinel] !== undefined || ext[sentinel] !== undefined)
    const norm = contiguousExt(
      { ...ext, [sentinel]: agentId },
      { ...config, [sentinel]: { portrait, focus: agent ? defaultFocusFor(agent) : 65 } },
    )
    persistExt(norm.ext)
    persistConfig(norm.config)
    setShowPicker(false)
  }

  const extDays = Object.entries(ext)
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([dateStr, agentId]) => {
      const agent = agents.find(a => a.id === agentId)
      return agent ? [{ dateStr, agent }] : []
    })

  // A portrait counts as "used" if some extended day already shows it
  // (its saved config portrait, or the agent's default when unconfigured).
  const extUsedPortraits = new Set(
    Object.entries(ext).flatMap(([dateStr, agentId]) => {
      const saved = config[dateStr]?.portrait
      if (saved) return [saved]
      const agent = agents.find(a => a.id === agentId)
      return agent?.splash_image ? [agent.splash_image] : []
    })
  )

  const cardProps = { config, onPick: pickPortraitFocus, onClear: clearDay }

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
    resetSaveBanner()
    persistConfig({})
    persistExt({})
    persistPendingRemove(new Set())
  }

  const hasAny = Object.keys(config).length > 0 || Object.keys(ext).length > 0 || pendingRemove.size > 0

  async function handleSaveDeploy() {
    setSaveState('saving')
    setSaveError('')
    try {
      const res = await fetch('/api/save-splash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ splashConfig: config, extSchedule: ext, removeDates: [...pendingRemove] }),
      })
      const data = await res.json()
      if (data.ok) {
        setSaveState('done')
        // These days are now baked into schedule.json itself — clearing them
        // locally stops the next save from resending an identical payload
        // (which makes `git commit` fail with "nothing to commit").
        persistExt({})
        persistPendingRemove(new Set())
        // Reload so `baseDays` reflects the schedule.json we just wrote,
        // instead of showing stale ext/base cards until a manual refresh.
        setTimeout(() => window.location.reload(), 900)
      } else {
        setSaveError(data.error ?? 'Unknown error')
        setSaveState('error')
      }
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e))
      setSaveState('error')
    }
  }

  return (
    <section>
      <div className="flex items-center gap-4 mb-1">
        <h2 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">
          Splash Art Config
        </h2>
        {hasAny && (
          <>
            <button
              onClick={handleSaveDeploy}
              disabled={saveState === 'saving'}
              className={`text-[10px] font-semibold transition-colors ${
                saveState === 'done' ? 'text-green-400' :
                saveState === 'error' ? 'text-red-400' :
                saveState === 'saving' ? 'text-zinc-500 cursor-wait' :
                'text-yellow-500/70 hover:text-yellow-400'
              }`}
            >
              {saveState === 'saving' ? '⏳ pushing...' :
               saveState === 'done' ? '✓ deployed!' :
               saveState === 'error' ? '✕ failed' :
               '↑ save & deploy'}
            </button>
            <button
              onClick={clearAll}
              className="text-[10px] text-zinc-700 hover:text-red-400 transition-colors"
            >
              ✕ clear all
            </button>
          </>
        )}
        {saveState === 'error' && saveError && (
          <span className="text-[9px] text-red-500 font-mono ml-2">{saveError}</span>
        )}
      </div>
      <p className="text-[10px] text-zinc-700 mb-5">
        Click a portrait to select it. Drag Focus Y to control zoom position. Leave unconfigured to use auto skin-detection.
      </p>

      <div className="flex flex-col gap-3">

        {baseDays.map(({ dateStr, agent, isToday }) => (
          <DayCard
            key={dateStr}
            dateStr={dateStr}
            agent={agent}
            isToday={isToday}
            pendingRemoval={pendingRemove.has(dateStr)}
            onRemoveSchedule={toggleRemoveBaseDay}
            {...cardProps}
          />
        ))}

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
          usedPortraits={extUsedPortraits}
        />
      )}

    </section>
  )
}
