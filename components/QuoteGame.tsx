'use client'

import type { Agent } from '@/lib/types'
import { getQuoteSegments } from '@/lib/quoteRedaction'
import GenericModeGame, { type RenderChallengeProps } from './GenericModeGame'

function QuoteChallenge({ targetAgent, isOver }: { targetAgent: Agent; isOver: boolean }) {
  const segments = getQuoteSegments(targetAgent)

  return (
    <div className="w-full rounded-xl border border-zinc-700/50 bg-zinc-800/40 p-6 flex flex-col gap-4">
      <div className="text-[10px] text-yellow-500 uppercase tracking-widest font-semibold">
        Who said this?
      </div>
      <blockquote className="text-lg text-zinc-100 font-medium italic leading-relaxed border-l-2 border-yellow-500/40 pl-4">
        &ldquo;
        {segments.map((seg, i) =>
          seg.redacted && !isOver ? (
            <span
              key={i}
              className="inline-block bg-zinc-200 text-transparent rounded px-1 -mx-0.5 select-none"
              aria-label="redacted"
            >
              {seg.text}
            </span>
          ) : (
            <span key={i} className={seg.redacted ? 'text-yellow-300' : undefined}>
              {seg.text}
            </span>
          )
        )}
        &rdquo;
      </blockquote>
      <p className="text-xs text-zinc-400">
        Guess the Zenless Zone Zero agent who said this quote.
      </p>
    </div>
  )
}

function getQuoteHints(agent: Agent): string[] {
  return [
    `Rarity: ${agent.rank}-Rank`,
    `Element: ${agent.attribute}`,
    `Faction: ${agent.faction}`,
    `Specialty: ${agent.specialty}`,
  ]
}

function renderQuoteChallenge({ targetAgent, isOver }: RenderChallengeProps) {
  return <QuoteChallenge targetAgent={targetAgent} isOver={isOver} />
}

export default function QuoteGame() {
  return (
    <GenericModeGame
      mode="quote"
      renderChallenge={renderQuoteChallenge}
      getHints={getQuoteHints}
    />
  )
}
