'use client'

import Image from 'next/image'
import type { Agent } from '@/lib/types'
import sprite from '@/data/agent-icon-sprite.json'

const index = sprite.index as Record<string, number>

export const AGENT_ICON_SPRITE_URL = sprite.url

/**
 * Small agent icon. Fills its (relative, sized) parent. Agents in the
 * pre-built sprite (npm run sprite) are drawn from that single image, which
 * the root layout preloads — so search results and guess rows show icons
 * instantly instead of waiting on one request per agent. Agents not in the
 * sprite yet fall back to loading their own icon file.
 */
export default function AgentIcon({ agent, sizes }: { agent: Agent; sizes: string }) {
  const i = index[agent.id]
  if (i !== undefined) {
    const col = i % sprite.cols
    const row = Math.floor(i / sprite.cols)
    const pos = (n: number, total: number) => (total > 1 ? (n / (total - 1)) * 100 : 0)
    return (
      <div
        role="img"
        aria-label={agent.name}
        className="absolute inset-0"
        style={{
          backgroundImage: `url("${sprite.url}")`,
          backgroundSize: `${sprite.cols * 100}% ${sprite.rows * 100}%`,
          backgroundPosition: `${pos(col, sprite.cols)}% ${pos(row, sprite.rows)}%`,
        }}
      />
    )
  }

  const src = agent.icon_image ?? agent.splash_image
  if (!src) return null
  return (
    <Image
      src={src}
      alt={agent.name}
      fill
      loading="lazy"
      className="object-cover object-top"
      sizes={sizes}
      onError={(e) => {
        ;(e.currentTarget as HTMLImageElement).style.display = 'none'
      }}
    />
  )
}
