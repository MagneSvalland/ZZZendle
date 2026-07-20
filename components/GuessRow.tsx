'use client'

import Image from 'next/image'
import type { GuessComparison, MatchResult } from '@/lib/types'

const TILE_BASE =
  'flex flex-col items-center justify-center rounded-md px-2 py-2 text-center text-xs font-bold min-h-[64px] w-[90px] shrink-0 transition-colors'

const tileColor: Record<MatchResult, string> = {
  exact: 'bg-yellow-500 text-black shadow-[0_0_14px_rgba(250,204,21,0.65)]',
  partial: 'bg-orange-500 text-black shadow-[0_0_10px_rgba(249,115,22,0.55)]',
  none: 'bg-zinc-800 text-zinc-400 border border-zinc-700/50',
}

function Tile({
  label,
  value,
  result,
  delay = 0,
}: {
  label: string
  value: string
  result: MatchResult
  delay?: number
}) {
  return (
    <div className="flex flex-col gap-1 items-center" style={{ perspective: '600px' }}>
      <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</span>
      <div
        className={`tile-pop ${TILE_BASE} ${tileColor[result]}`}
        style={{ animationDelay: `${delay}ms` }}
      >
        <span className="leading-tight">{value}</span>
      </div>
    </div>
  )
}

type ReleaseResult = 'exact' | 'earlier' | 'later' | 'none'

function ReleaseTile({
  version,
  result,
  delay = 0,
}: {
  version: string
  result: ReleaseResult
  delay?: number
}) {
  const color = result === 'exact' ? tileColor.exact : tileColor.none
  // 'earlier' = answer is a newer version → point up; 'later' = older → point down.
  const arrow = result === 'earlier' ? '▲' : result === 'later' ? '▼' : ''
  return (
    <div className="flex flex-col gap-1 items-center" style={{ perspective: '600px' }}>
      <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Version</span>
      <div className={`tile-pop ${TILE_BASE} ${color}`} style={{ animationDelay: `${delay}ms` }}>
        <span className="leading-tight flex items-center gap-1">
          {version}
          {arrow && <span className="text-sm leading-none">{arrow}</span>}
        </span>
      </div>
    </div>
  )
}

function AgentAvatar({ name, src }: { name: string; src: string | null }) {
  return (
    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-700/50">
      <span className="text-xs font-bold text-zinc-500 z-0">
        {name
          .split(' ')
          .map((w) => w[0])
          .join('')
          .slice(0, 2)}
      </span>
      {src && (
        <Image
          src={src}
          alt={name}
          fill
          className="object-cover object-top"
          sizes="40px"
          onError={(e) => {
            ;(e.currentTarget as HTMLImageElement).style.display = 'none'
          }}
        />
      )}
    </div>
  )
}

interface Props {
  comparison: GuessComparison
  guessNumber: number
}

export default function GuessRow({ comparison, guessNumber }: Props) {
  const { agent, results, isCorrect } = comparison

  return (
    <div
      className={`row-slide-in flex items-center gap-3 p-3 rounded-xl border transition-colors ${
        isCorrect
          ? 'border-yellow-500/40 bg-yellow-950/10 shadow-[0_0_20px_rgba(250,204,21,0.07)]'
          : 'border-zinc-700/40 bg-zinc-900/40'
      }`}
    >
      {/* Agent info — fixed width so tiles always start at the same position */}
      <div className="flex items-center gap-2 shrink-0 w-[148px]">
        <span className="text-zinc-400 text-sm w-4 shrink-0">{guessNumber}.</span>
        <AgentAvatar name={agent.name} src={agent.icon_image ?? agent.splash_image} />
        <div className="flex flex-col min-w-0 flex-1">
          <span
            className={`text-xs font-semibold leading-tight truncate ${
              isCorrect ? 'text-yellow-300' : 'text-white'
            }`}
          >
            {agent.name}
          </span>
          <span className="text-[10px] text-zinc-400">{agent.rank}-Rank</span>
        </div>
      </div>

      {/* Horizontally scrollable tiles */}
      <div
        className="flex-1 min-w-0 overflow-x-auto"
        style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'thin', scrollbarColor: '#52525b transparent' }}
      >
        <div className="flex gap-2 pb-1">
          <Tile label="Faction"   value={agent.faction}           result={results.faction}    delay={0} />
          <Tile label="Element"   value={agent.attribute}         result={results.attribute}  delay={70} />
          <Tile label="Specialty" value={agent.specialty}         result={results.specialty}  delay={140} />
          <Tile label="Rarity"    value={`${agent.rank}-Rank`}   result={results.rank}       delay={210} />
          <Tile label="Gender"    value={agent.gender}            result={results.gender}     delay={280} />
          <ReleaseTile            version={agent.release_version} result={results.release}    delay={350} />
        </div>
      </div>
    </div>
  )
}
