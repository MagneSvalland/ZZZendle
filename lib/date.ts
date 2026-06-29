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
