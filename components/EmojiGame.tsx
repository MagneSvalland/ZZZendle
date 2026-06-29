'use client'

import type { Agent } from '@/lib/types'
import GenericModeGame, { type RenderChallengeProps } from './GenericModeGame'

function EmojiChallenge({
  targetAgent,
  wrongGuesses,
}: {
  targetAgent: Agent
  wrongGuesses: number
}) {
  const emojisToShow = Math.min(wrongGuesses + 1, targetAgent.emojis.length)

  return (
    <div className="w-full rounded-xl border border-zinc-700/50 bg-zinc-800/40 p-8 flex flex-col items-center gap-6">
      <div className="text-[10px] text-yellow-500 uppercase tracking-widest font-semibold">
        Who do these emojis represent?
      </div>
      <div className="flex gap-3 flex-wrap justify-center">
        {targetAgent.emojis.map((emoji, i) =>
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
        {emojisToShow < targetAgent.emojis.length
          ? `${emojisToShow} of ${targetAgent.emojis.length} emojis revealed — guess to reveal more`
          : 'All emojis revealed'}
      </p>
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
