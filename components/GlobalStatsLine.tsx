'use client'

import { useEffect, useState } from 'react'
import type { GlobalSummary } from '@/lib/globalStats'

// "Today's average: 4.7 guesses · You're in the top 12%" on the result panel.
// The first visit after finishing POSTs the result (recording it); later
// visits only GET. Renders nothing while loading, when the stats backend
// isn't configured (e.g. local dev without Redis) or when a request fails.

const sentKey = (mode: string, date: string) => `zzzendle-stats-sent-${mode}-${date}`

export default function GlobalStatsLine({
  mode,
  date,
  guessCount,
  disabled,
}: {
  mode: string
  date: string | null
  guessCount: number
  disabled?: boolean
}) {
  // undefined = nothing to show, null = not enough results yet
  const [summary, setSummary] = useState<GlobalSummary | null | undefined>(undefined)

  useEffect(() => {
    if (disabled || !date || guessCount < 1) return
    let sent = false
    try { sent = localStorage.getItem(sentKey(mode, date)) === '1' } catch { /* ignore */ }

    const req = sent
      ? fetch(`/api/stats?${new URLSearchParams({ mode, date, guesses: String(guessCount) })}`)
      : fetch('/api/stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode, date, guesses: guessCount }),
        })

    let cancelled = false
    req
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (cancelled || !d?.enabled) return
        if (!sent) {
          try { localStorage.setItem(sentKey(mode, date), '1') } catch { /* ignore */ }
        }
        setSummary(d.summary ?? null)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [mode, date, guessCount, disabled])

  if (summary === undefined) return null

  if (summary === null) {
    return <p className="text-zinc-500 text-xs">Global stats appear once more players have finished — check back later!</p>
  }

  const label = summary.scope === 'today' ? "Today's average" : "This week's average"
  return (
    <p className="text-zinc-400 text-xs">
      {label}: <span className="text-zinc-200 font-semibold">{summary.average.toFixed(1)}</span> guesses
      {summary.topPercent <= 50 && (
        <>
          {' · '}You&apos;re in the <span className="text-yellow-400 font-semibold">top {summary.topPercent}%</span>
        </>
      )}
    </p>
  )
}
