'use client'

import { useState, useEffect } from 'react'
import type { Agent } from '@/lib/types'
import GenericModeGame, { type RenderChallengeProps } from './GenericModeGame'
import { SPLASH_CONFIG_KEY, type SplashConfig } from './SplashConfigurator'
import { getEffectiveDate, isLocalOrigin } from '@/lib/date'
import { SPLASH_ZOOM_LEVELS } from '@/lib/splashZoom'

// Cache detected focus positions per agent ID for the session
const focusCache = new Map<string, string>()

function isSkin(r: number, g: number, b: number): boolean {
  // Must be bright enough to be visible skin
  if (r < 100) return false
  // Skip near-white (background / overexposed)
  if (r > 252 && g > 252 && b > 252) return false

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  if (max === 0) return false

  // Saturation: not too grey (background), not too vivid (colored clothing)
  const sat = (max - min) / max
  if (sat < 0.08 || sat > 0.68) return false

  // Red must dominate — skin is never blue/green dominant
  if (max !== r) return false

  // Hue 0–50° covers red-to-orange-yellow (all human skin tones in anime art)
  const rawHue = 60 * ((g - b) / (max - min))
  const hue = rawHue < 0 ? rawHue + 360 : rawHue
  return hue >= 0 && hue <= 50
}

function detectSkinFocus(img: HTMLImageElement): string {
  try {
    // Downscale for speed — 80px wide is plenty for row-level analysis
    const W = 80
    const H = Math.round(img.naturalHeight * (W / img.naturalWidth))
    if (H < 10) return 'center 65%'

    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return 'center 65%'

    ctx.drawImage(img, 0, 0, W, H)
    const { data } = ctx.getImageData(0, 0, W, H)

    // Exclude top 28% (face) and bottom 8% (floor / feet cut-off)
    const rowStart = Math.floor(H * 0.28)
    const rowEnd   = Math.floor(H * 0.92)

    const skinPerRow: number[] = []
    for (let y = rowStart; y < rowEnd; y++) {
      let count = 0
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4
        if (data[i + 3] < 200) continue   // skip transparent
        if (isSkin(data[i], data[i + 1], data[i + 2])) count++
      }
      skinPerRow.push(count)
    }

    // Slide a window (~8% of image height) to find the densest skin band
    const win = Math.max(3, Math.floor(H * 0.08))
    let bestScore = 0
    let bestCenter = rowStart + Math.floor((rowEnd - rowStart) / 2)

    for (let i = 0; i <= skinPerRow.length - win; i++) {
      let score = 0
      for (let j = i; j < i + win; j++) score += skinPerRow[j]
      if (score > bestScore) {
        bestScore = score
        bestCenter = rowStart + i + Math.floor(win / 2)
      }
    }

    // If no skin found, return empty string so caller uses the fallback
    if (bestScore === 0) return ''

    const pct = Math.round((bestCenter / H) * 100)
    return `center ${Math.max(32, Math.min(85, pct))}%`
  } catch {
    return ''
  }
}

// Defined at module level so React preserves state across parent re-renders
function SplashChallenge({
  wrongGuesses,
  isOver,
  targetAgent,
}: {
  wrongGuesses: number
  isOver: boolean
  targetAgent: Agent
}) {
  // Separate base and skins so they don't get mixed in random selection
  const basePortrait = targetAgent.splash_image
  const skinPortraits = (targetAgent.alt_splash_images ?? []).filter((s): s is string => !!s)
  const allPortraitOptions = [basePortrait, ...skinPortraits].filter((s): s is string => !!s)

  const [portraitSrc, setPortraitSrc] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)
  const [focusPos, setFocusPos] = useState<string>(targetAgent.splash_focus ?? 'center 65%')
  // Config (portrait/focus override) now comes from an async fetch instead
  // of a synchronous static import — without this, the very first paint used
  // the default portrait/focus and then visibly snapped to the configured
  // one a moment later. Holding off on rendering until config resolves
  // (fast — a single same-origin fetch) avoids that flash.
  const [configLoaded, setConfigLoaded] = useState(false)

  useEffect(() => {
    if (allPortraitOptions.length === 0) return
    let cancelled = false

    ;(async () => {
      // 1. Check config: fetched fresh from disk (deployed truth) — a build-
      // time static import here would go stale relative to what's actually
      // on disk (same class of bug fixed in SplashConfigurator's `schedule`;
      // see that component's comment for why) — then localStorage override.
      const today = getEffectiveDate()
      let src: string | null = null
      let manualFocus: number | null = null
      let manualFocusX: number | null = null

      try {
        const res = await fetch('/api/schedule-data', { cache: 'no-store' })
        const fresh = await res.json()
        if (cancelled) return
        const staticCfg = (fresh.splashConfig ?? {}) as SplashConfig
        const staticDay = staticCfg[today]
        if (staticDay?.portrait && allPortraitOptions.includes(staticDay.portrait)) {
          src = staticDay.portrait
        }
        if (staticDay?.focus != null) manualFocus = staticDay.focus
        if (staticDay?.focusX != null) manualFocusX = staticDay.focusX
      } catch { /* ignore — falls through to localStorage / default below */ }

      // Only trust a localStorage override on a local dev server — see
      // isLocalOrigin's comment. On any other origin (including the live
      // site) this is skipped entirely so the game always uses the plain,
      // correct server config with no risk of a stale local edit silently
      // overriding it forever.
      if (isLocalOrigin()) {
        try {
          const raw = localStorage.getItem(SPLASH_CONFIG_KEY)
          if (raw) {
            const cfg: SplashConfig = JSON.parse(raw)
            const day = cfg[today]
            if (day?.portrait && allPortraitOptions.includes(day.portrait)) {
              src = day.portrait
            }
            if (day?.focus != null) manualFocus = day.focus
            if (day?.focusX != null) manualFocusX = day.focusX
          }
        } catch { /* ignore */ }
      }

      // 2. No manual config → use the default splash. Skins only ever show when
      //    explicitly configured for that day in the debug page.
      if (!src) {
        src = basePortrait ?? skinPortraits[0] ?? null
        if (!src) { setConfigLoaded(true); return }
      }

      setPortraitSrc(src)

      // 3. Manual focus skips skin detection
      if (manualFocus !== null && src) {
        const pos = `${manualFocusX ?? 50}% ${manualFocus}%`
        focusCache.set(src, pos)
        setFocusPos(pos)
        setConfigLoaded(true)
        return
      }

      // 4. Auto skin-detection
      if (!src) { setConfigLoaded(true); return }
      const cacheKey = src
      if (focusCache.has(cacheKey)) {
        setFocusPos(focusCache.get(cacheKey)!)
        setConfigLoaded(true)
        return
      }

      const img = new window.Image()
      img.onload = () => {
        const detected = detectSkinFocus(img)
        const pos = detected || targetAgent.splash_focus || 'center 65%'
        focusCache.set(cacheKey, pos)
        setFocusPos(pos)
      }
      img.src = src
      // Reveal now with the default focus — the sharper skin-detected crop
      // (if any) swaps in a moment later once the image analysis finishes.
      setConfigLoaded(true)
    })()

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetAgent.id])

  const bgSize = isOver
    ? 'contain'
    : `${SPLASH_ZOOM_LEVELS[Math.min(wrongGuesses, SPLASH_ZOOM_LEVELS.length - 1)]}%`

  if (!configLoaded) {
    return <div className="w-72 h-72 rounded-xl bg-zinc-800 border border-zinc-700/50 animate-pulse" />
  }

  if (imageError || !portraitSrc) {
    return (
      <div className="w-72 h-72 rounded-xl bg-zinc-800 border border-zinc-700/50 flex flex-col items-center justify-center gap-3 text-center px-6">
        <span className="text-4xl">🖼️</span>
        <p className="text-zinc-500 text-sm leading-relaxed">
          No splash art available for this agent.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-[10px] text-yellow-500 uppercase tracking-widest font-semibold">
        Who is this agent?
      </div>

      {/* Hidden img for error detection */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={portraitSrc}
        alt=""
        className="hidden"
        onError={() => setImageError(true)}
      />

      <div
        className="w-72 h-72 rounded-xl overflow-hidden border border-zinc-700/50 bg-zinc-800 relative"
        aria-label="Cropped splash art — guess the agent"
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            // Double-quoted url() — an unquoted one can't contain a literal
            // apostrophe, and encodeURI() doesn't escape it either (it's in
            // JS's "unreserved" set). Breaks portraits like
            // "Agent_Sigrid_de_L'Azur" otherwise.
            backgroundImage: `url("${portraitSrc}")`,
            backgroundSize: bgSize,
            backgroundPosition: focusPos,
            backgroundRepeat: 'no-repeat',
            transition: 'background-size 0.4s ease',
          }}
        />
      </div>

    </div>
  )
}

function getSplashHints(_agent: Agent): string[] {
  return []
}

function renderSplashChallenge({ wrongGuesses, isOver, targetAgent }: RenderChallengeProps) {
  return (
    <SplashChallenge
      wrongGuesses={wrongGuesses}
      isOver={isOver}
      targetAgent={targetAgent}
    />
  )
}

export default function SplashGame() {
  return (
    <GenericModeGame
      mode="splash"
      renderChallenge={renderSplashChallenge}
      getHints={getSplashHints}
    />
  )
}
