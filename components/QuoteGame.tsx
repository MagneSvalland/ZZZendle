'use client'

import type { Agent } from '@/lib/types'
import GenericModeGame, { type RenderChallengeProps } from './GenericModeGame'

function QuoteChallenge({ targetAgent }: { targetAgent: Agent }) {
  return (
    <div className="w-full rounded-xl border border-zinc-700/50 bg-zinc-800/40 p-6 flex flex-col gap-4">
      <div className="text-[10px] text-yellow-500 uppercase tracking-widest font-semibold">
        Who said this?
      </div>
      <blockquote className="text-lg text-zinc-100 font-medium italic leading-relaxed border-l-2 border-yellow-500/40 pl-4">
        &ldquo;{targetAgent.quote}&rdquo;
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

function renderQuoteChallenge({ targetAgent }: RenderChallengeProps) {
  return <QuoteChallenge targetAgent={targetAgent} />
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
