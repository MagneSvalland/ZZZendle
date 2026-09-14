export const DEBUG_DATE_KEY = 'zzzendle-debug-date'

function getETDateStr(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date())
}

export function getEffectiveDate(): string {
  if (typeof window === 'undefined') return getETDateStr()
  try {
    const override = localStorage.getItem(DEBUG_DATE_KEY)
    if (override) return override
  } catch { /* ignore */ }
  return getETDateStr()
}

export function advanceDebugDate(): string {
  const current = getEffectiveDate()
  const d = new Date(current + 'T12:00:00')
  d.setDate(d.getDate() + 1)
  const next = d.toLocaleDateString('en-CA')
  localStorage.setItem(DEBUG_DATE_KEY, next)
  return next
}

export function clearDebugDate() {
  localStorage.removeItem(DEBUG_DATE_KEY)
}

// "save & deploy" (app/api/save-splash/route.ts) only ever works from a
// local dev server — it shells out to git, and read-only serverless has no
// repo to commit to. Staging edits in localStorage on any other origin is
// worse than useless: they can never be saved, yet they silently keep
// overriding correct freshly-fetched server data forever, on both the
// /debug admin panel (SplashConfigurator.tsx) and the live splash game
// itself (SplashGame.tsx) — a stale local edit from once poking at /debug
// directly on zzzendle.com then shadows real data with no visible sign
// anything is wrong. Both gate their localStorage reads/writes on this.
export function isLocalOrigin(): boolean {
  if (typeof window === 'undefined') return false
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
}
