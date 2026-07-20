'use client'

import type { Agent } from '@/lib/types'
import GenericModeGame, { type RenderChallengeProps } from './GenericModeGame'
import { getEffectiveDate } from '@/lib/date'

function seedHash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
    h >>>= 0
  }
  return h
}

function seededShuffle<T>(arr: T[], seed: string): T[] {
  const result = [...arr]
  let h = seedHash(seed)
  for (let i = result.length - 1; i > 0; i--) {
    h = seedHash(String(h))
    const j = h % (i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function EmojiChallenge({
  targetAgent,
  wrongGuesses,
}: {
  targetAgent: Agent
  wrongGuesses: number
}) {
  const dateStr = getEffectiveDate()
  const first4Shuffled = seededShuffle(targetAgent.emojis.slice(0, 4), dateStr + targetAgent.id)
  const displayEmojis = [...first4Shuffled, targetAgent.emojis[4]]
  const emojisToShow = Math.min(wrongGuesses + 1, displayEmojis.length)

  return (
    <div className="w-full rounded-xl border border-zinc-700/50 bg-zinc-800/40 p-8 flex flex-col items-center gap-6">
      <div className="text-[10px] text-yellow-500 uppercase tracking-widest font-semibold">
        Who do these emojis represent?
      </div>
      <div className="flex gap-3 flex-wrap justify-center">
        {displayEmojis.map((emoji, i) =>
          i < emojisToShow ? (
            <span
              key={i}
              className="text-5xl select-none filter drop-shadow-[0_0_6px_rgba(250,204,21,0.3)]"
            >
              {emoji}
            </span>
          ) : (
            <span
              key={i}
              className="text-5xl select-none opacity-30"
            >
              ❓
            </span>
          ),
        )}
      </div>
      <p className="text-xs text-zinc-400">
        {emojisToShow < displayEmojis.length
          ? `${emojisToShow} of ${displayEmojis.length} emojis revealed — guess to reveal more`
          : 'All emojis revealed'}
      </p>
      <p className="text-[10px] text-zinc-600 self-start -mb-4">Thanks to Oxymore for the emoji combinations 🙏</p>
    </div>
  )
}

function getEmojiHints(_agent: Agent): string[] {
  return []
}

function renderEmojiChallenge({ targetAgent, wrongGuesses }: RenderChallengeProps) {
  return <EmojiChallenge targetAgent={targetAgent} wrongGuesses={wrongGuesses} />
}

export default function EmojiGame() {
  return (
    <GenericModeGame
      mode="emoji"
      renderChallenge={renderEmojiChallenge}
      getHints={getEmojiHints}
    />
  )
}
