'use client'

import AgentIcon from './AgentIcon'
import type { Agent, GuessComparison, MatchResult } from '@/lib/types'
import { TILE_SCHEMES, DEFAULT_TILE_SCHEME, type TileColorScheme } from '@/lib/tileColorScheme'

const TILE_BASE =
  'flex flex-col items-center justify-center rounded-md px-2 py-2 text-center text-xs font-bold min-h-[64px] w-[90px] shrink-0 transition-colors'

function Tile({
  label,
  value,
  result,
  scheme,
  delay = 0,
}: {
  label: string
  value: string
  result: MatchResult
  scheme: TileColorScheme
  delay?: number
}) {
  const preset = TILE_SCHEMES[scheme]
  const color = preset[result]
  return (
    <div className="flex flex-col gap-1 items-center" style={{ perspective: '600px' }}>
      <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</span>
      <div
        className={`tile-pop ${TILE_BASE} ${preset.tileShadow} ${color}`}
        style={{ animationDelay: `${delay}ms` }}
      >
        <span className={`leading-tight ${preset.textShadow}`}>{value}</span>
      </div>
    </div>
  )
}

type ReleaseResult = 'exact' | 'earlier' | 'later' | 'none'

function ReleaseTile({
  version,
  result,
  scheme,
  delay = 0,
}: {
  version: string
  result: ReleaseResult
  scheme: TileColorScheme
  delay?: number
}) {
  const preset = TILE_SCHEMES[scheme]
  const color = result === 'exact' ? preset.exact : preset.none
  // 'earlier' = answer is a newer version → point up; 'later' = older → point down.
  const arrow = result === 'earlier' ? '▲' : result === 'later' ? '▼' : ''
  return (
    <div className="flex flex-col gap-1 items-center" style={{ perspective: '600px' }}>
      <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Version</span>
      <div className={`tile-pop ${TILE_BASE} ${preset.tileShadow} ${color}`} style={{ animationDelay: `${delay}ms` }}>
        <span className={`leading-tight flex items-center gap-1 ${preset.textShadow}`}>
          {version}
          {arrow && <span className="text-sm leading-none">{arrow}</span>}
        </span>
      </div>
    </div>
  )
}

function AgentAvatar({ agent }: { agent: Agent }) {
  return (
    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-700/50">
      <span className="text-xs font-bold text-zinc-500 z-0">
        {agent.name
          .split(' ')
          .map((w) => w[0])
          .join('')
          .slice(0, 2)}
      </span>
      <AgentIcon agent={agent} sizes="40px" />
    </div>
  )
}

interface Props {
  comparison: GuessComparison
  guessNumber: number
  scheme?: TileColorScheme
}

export default function GuessRow({ comparison, guessNumber, scheme = DEFAULT_TILE_SCHEME }: Props) {
  const { agent, results, isCorrect } = comparison
  const preset = TILE_SCHEMES[scheme]

  return (
    <div
      className={`row-slide-in flex items-center gap-3 p-3 rounded-xl border transition-colors overflow-x-auto sm:overflow-x-visible ${
        isCorrect ? preset.correctRow : 'border-zinc-700/40 bg-zinc-900/40'
      }`}
      style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'thin', scrollbarColor: '#52525b transparent' }}
    >
      {/* Agent info — fixed width so tiles always start at the same position */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-zinc-400 text-sm w-4 shrink-0">{guessNumber}.</span>
        <AgentAvatar agent={agent} />
        <div className="flex flex-col">
          <span
            className={`text-sm font-semibold leading-tight whitespace-nowrap ${
              isCorrect ? preset.correctName : 'text-white'
            }`}
          >
            {agent.name}
          </span>
          <span className="text-[10px] text-zinc-400">{agent.rank}-Rank</span>
        </div>
      </div>

      {/* Tiles — on mobile the whole row scrolls (name included); on sm+ only the tiles scroll */}
      <div
        className="shrink-0 sm:shrink sm:flex-1 sm:min-w-0 sm:overflow-x-auto"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#52525b transparent' }}
      >
        <div className="flex sm:justify-end gap-2 pb-1">
          <Tile label="Faction"   value={agent.faction}           result={results.faction}    scheme={scheme} delay={0} />
          <Tile label="Element"   value={agent.attribute}         result={results.attribute}  scheme={scheme} delay={70} />
          <Tile label="Specialty" value={agent.specialty}         result={results.specialty}  scheme={scheme} delay={140} />
          <Tile label="Rarity"    value={`${agent.rank}-Rank`}   result={results.rank}       scheme={scheme} delay={210} />
          <Tile label="Gender"    value={agent.gender}            result={results.gender}     scheme={scheme} delay={280} />
          <ReleaseTile            version={agent.release_version} result={results.release}    scheme={scheme} delay={350} />
        </div>
      </div>
    </div>
  )
}
