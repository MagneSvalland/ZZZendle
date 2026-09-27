'use client'

import { useState } from 'react'
import { buildDailySummary, getPuzzleNumber, loadDailyResults } from '@/lib/stats'
import { getEffectiveDate } from '@/lib/date'

// Shared share row for the result panels and StatsModal. On touch devices
// "Share" opens the native share sheet (Discord, Messages, etc.); on desktop
// it copies to the clipboard, since the OS share dialog there is clunkier
// than just pasting.

function canNativeShare(): boolean {
  return typeof navigator !== 'undefined'
    && typeof navigator.share === 'function'
    && window.matchMedia('(pointer: coarse)').matches
}

async function shareOrCopy(text: string): Promise<'shared' | 'copied' | 'failed'> {
  if (canNativeShare()) {
    try {
      await navigator.share({ text })
      return 'shared'
    } catch (err) {
      // User closed the share sheet — not an error, and don't fall back to copying
      if (err instanceof DOMException && err.name === 'AbortError') return 'failed'
    }
  }
  try {
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch {
    return 'failed'
  }
}

export default function ShareButtons({ shareText, large = false }: { shareText: string; large?: boolean }) {
  const [feedback, setFeedback] = useState<{ key: 'mode' | 'all'; label: string } | null>(null)

  async function handle(key: 'mode' | 'all', text: string) {
    const result = await shareOrCopy(text)
    if (result === 'copied') {
      setFeedback({ key, label: '✓ Copied!' })
      setTimeout(() => setFeedback(null), 2000)
    }
  }

  function shareAll() {
    const today = getEffectiveDate()
    handle('all', buildDailySummary(getPuzzleNumber(today), loadDailyResults(today)))
  }

  const size = large ? 'flex-1 py-2.5 rounded-xl' : 'px-4 py-1.5 rounded-lg'
  const modeCopied = feedback?.key === 'mode'
  const allCopied = feedback?.key === 'all'

  return (
    <>
      <button
        onClick={() => handle('mode', shareText)}
        className={`${size} text-sm font-semibold transition-all duration-150 ${
          modeCopied ? 'bg-green-600 text-white' : 'bg-yellow-500 text-black hover:bg-yellow-400'
        }`}
      >
        {modeCopied ? feedback.label : 'Share'}
      </button>
      <button
        onClick={shareAll}
        title="Share your results from every daily mode"
        className={`${size} text-sm font-semibold transition-all duration-150 ${
          allCopied ? 'bg-green-600 text-white' : 'border border-yellow-500/50 text-yellow-400 hover:border-yellow-400 hover:text-yellow-300'
        }`}
      >
        {allCopied ? feedback.label : 'Share all modes'}
      </button>
      <button
        onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank')}
        className={`${size} text-sm font-semibold bg-black border border-zinc-700 text-white hover:bg-zinc-900 transition-colors`}
      >
        𝕏
      </button>
    </>
  )
}
