// Pure, dependency-free scheduling logic shared between the /debug admin
// panel (components/SplashConfigurator.tsx) and the save endpoint
// (app/api/save-splash/route.ts) — kept here (instead of inline in either)
// so both sides compact schedule.json the same way, and so it's unit
// testable without a browser or a Next.js request.

export function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return d.toLocaleDateString('en-CA')
}

export type SplashDayConfig = { portrait: string; focus: number; focusX?: number }
export type SplashConfig = Record<string, SplashDayConfig>
export type DateMap = Record<string, string>

// Re-index a set of not-yet-saved "extra" days (added via the admin picker,
// staged client-side before save) so each one lands on the next real open
// date — filling any gap in `schedule` before continuing past the last
// scheduled day. Removing a day from `extMap` before calling this shifts
// the rest up so the queue stays packed into the earliest available slots.
export function contiguousExt(
  extMap: Record<string, string>,
  configMap: SplashConfig,
  schedule: Record<string, string>,
  todayStr: string,
): { ext: Record<string, string>; config: SplashConfig } {
  const nextExt: Record<string, string> = {}
  const nextConfig: SplashConfig = {}
  // Keep configs that belong to scheduled (non-extended) days untouched.
  for (const [d, c] of Object.entries(configMap)) {
    if (extMap[d] === undefined) nextConfig[d] = c
  }
  let cursor = todayStr
  Object.keys(extMap).sort().forEach((oldDate) => {
    do {
      cursor = addDays(cursor, 1)
    } while (schedule[cursor] !== undefined || nextExt[cursor] !== undefined)
    nextExt[cursor] = extMap[oldDate]
    if (configMap[oldDate]) nextConfig[cursor] = configMap[oldDate]
  })
  return { ext: nextExt, config: nextConfig }
}

// Closes any gaps among a schedule's current-or-future days by packing them
// onto consecutive calendar dates starting at `todayStr` — so removing a
// day (e.g. deleting an agent from a scheduled day) shifts every later day
// back to fill the vacancy instead of leaving a hole in schedule.json.
// Days before `todayStr` are left completely untouched. Returns both the
// compacted schedule and the old-date -> new-date map, so any other
// date-keyed data tied to these days (e.g. splash-config.json entries) can
// be moved in lockstep via `remapDates`.
export function compactFutureSchedule(
  schedule: Record<string, string>,
  todayStr: string,
): { schedule: Record<string, string>; dateMap: DateMap } {
  const result: Record<string, string> = {}
  const dateMap: DateMap = {}
  const futureDates: string[] = []

  for (const [date, agentId] of Object.entries(schedule)) {
    if (date < todayStr) {
      result[date] = agentId
      dateMap[date] = date
    } else {
      futureDates.push(date)
    }
  }
  futureDates.sort()

  futureDates.forEach((oldDate, i) => {
    const newDate = addDays(todayStr, i)
    result[newDate] = schedule[oldDate]
    dateMap[oldDate] = newDate
  })

  return { schedule: result, dateMap }
}

// Applies a date remap (as produced by compactFutureSchedule) to any other
// date-keyed map that must move in lockstep with the schedule. A key with
// no entry in `dateMap` (a date the schedule pass never touched) is kept
// as-is rather than dropped.
export function remapDates<T>(map: Record<string, T>, dateMap: DateMap): Record<string, T> {
  const result: Record<string, T> = {}
  for (const [date, value] of Object.entries(map)) {
    result[dateMap[date] ?? date] = value
  }
  return result
}
