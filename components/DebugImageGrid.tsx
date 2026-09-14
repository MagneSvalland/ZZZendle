'use client'

import { useDevAuth } from '@/contexts/DevAuthContext'
import type { Agent } from '@/lib/types'

// This is the heavy part of /debug — three separate galleries covering all
// ~135 agent images (icon+portrait per agent, then the full portrait list,
// then the full icon list again). None of that needs to be public: it's a
// dev tool, and every unauthenticated visit (including bots/crawlers, since
// this page previously rendered the images unconditionally) was burning
// ~150+ image requests against the Vercel edge-request quota for zero
// reason. Gating it in a client component means the images never appear in
// the server-rendered HTML (or after hydration) unless `isDevAuth` is
// already true from localStorage — so it's not just hidden by CSS, the
// <img> tags simply don't exist for anyone who hasn't logged in.

function Missing({ label }: { label: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <span className="text-[8px] text-red-400/70 font-semibold uppercase tracking-wider">{label}</span>
    </div>
  )
}

interface Props {
  agents: Agent[]
  iconFiles: string[]
  portraitFiles: string[]
  referencedIcons: string[]
  referencedPortraits: string[]
}

export default function DebugImageGrid({ agents, iconFiles, portraitFiles, referencedIcons, referencedPortraits }: Props) {
  const { isDevAuth } = useDevAuth()

  if (!isDevAuth) {
    return (
      <p className="text-zinc-700 text-sm">Log in as developer (bottom-right button) to view image galleries.</p>
    )
  }

  const referencedIconsSet = new Set(referencedIcons)
  const referencedPortraitsSet = new Set(referencedPortraits)

  return (
    <div className="flex flex-col gap-14">

      {/* ── Agent grid ── */}
      <section>
        <h2 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-5">
          Agents — icons &amp; portraits
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {agents.map(agent => (
            <div
              key={agent.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 flex flex-col gap-2.5"
            >
              <div>
                <div className="text-[11px] font-semibold text-white leading-snug">{agent.name}</div>
                <div className="text-[9px] text-zinc-600 mt-0.5">{agent.rank} · {agent.attribute}</div>
              </div>

              <div className="flex gap-2 items-start">
                {/* Icon */}
                <div className="flex flex-col gap-1 shrink-0">
                  <div className="text-[8px] text-zinc-700 uppercase tracking-wider text-center">Icon</div>
                  <div className={`w-10 h-10 rounded-lg overflow-hidden border flex items-center justify-center ${
                    agent.icon_image ? 'border-zinc-700/40 bg-zinc-800' : 'border-red-900/50 bg-red-950/30'
                  }`}>
                    {agent.icon_image
                      /* eslint-disable-next-line @next/next/no-img-element */
                      ? <img src={agent.icon_image} alt="" className="w-full h-full object-cover object-top" />
                      : <Missing label="✕" />
                    }
                  </div>
                </div>

                {/* Portraits: main + alts */}
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <div className="text-[8px] text-zinc-700 uppercase tracking-wider">
                    Portrait{(agent.alt_splash_images?.length ?? 0) > 0 ? ` +${agent.alt_splash_images!.length} skin` : ''}
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {/* Main portrait */}
                    <div className={`w-10 aspect-[5/8] rounded overflow-hidden border flex items-center justify-center ${
                      agent.splash_image ? 'border-zinc-700/40 bg-zinc-800' : 'border-red-900/50 bg-red-950/30'
                    }`}>
                      {agent.splash_image
                        /* eslint-disable-next-line @next/next/no-img-element */
                        ? <img src={agent.splash_image} alt="" className="w-full h-full object-cover object-top" />
                        : <Missing label="✕" />
                      }
                    </div>
                    {/* Alt skins */}
                    {agent.alt_splash_images?.map((src, i) => (
                      <div key={i} className="w-10 aspect-[5/8] rounded overflow-hidden border border-yellow-500/40 bg-zinc-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" className="w-full h-full object-cover object-top" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Portrait files ── */}
      <section>
        <h2 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">
          All portrait files ({portraitFiles.length})
        </h2>
        <p className="text-[10px] text-zinc-700 mb-5">
          Yellow border = not referenced in agents.json (alternate skin / unlinked)
        </p>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
          {portraitFiles.map(file => {
            const src = `/images/agents/${file}`
            const linked = referencedPortraitsSet.has(src)
            const label = file
              .replace(/^Agent_/, '')
              .replace(/_Portrait\.png$/, '')
              .replace(/_/g, ' ')
            return (
              <div
                key={file}
                className={`flex flex-col gap-1 rounded-lg border p-1.5 ${
                  linked ? 'border-zinc-800 bg-zinc-900/60' : 'border-yellow-500/50 bg-yellow-950/20'
                }`}
              >
                <div className="w-full aspect-[5/8] rounded overflow-hidden bg-zinc-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="w-full h-full object-cover object-top" />
                </div>
                <div className="text-[8px] text-zinc-400 leading-tight break-words" title={file}>{label}</div>
                {!linked && (
                  <span className="text-[7px] text-yellow-500 font-semibold">unlinked</span>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Icon files ── */}
      <section>
        <h2 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-5">
          All icon files ({iconFiles.length})
        </h2>
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
          {iconFiles.map(file => {
            const src = `/images/agents/${file}`
            const linked = referencedIconsSet.has(src)
            const label = file
              .replace(/^Agent_/, '')
              .replace(/_Icon\.png$/, '')
              .replace(/_/g, ' ')
            return (
              <div
                key={file}
                className={`flex flex-col gap-1 rounded-lg border p-1 ${
                  linked ? 'border-zinc-800 bg-zinc-900/60' : 'border-yellow-500/50 bg-yellow-950/20'
                }`}
              >
                <div className="w-full aspect-square rounded overflow-hidden bg-zinc-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="w-full h-full object-cover object-top" />
                </div>
                <div className="text-[8px] text-zinc-400 leading-tight break-words" title={file}>{label}</div>
                {!linked && (
                  <span className="text-[7px] text-yellow-500 font-semibold">unlinked</span>
                )}
              </div>
            )
          })}
        </div>
      </section>

    </div>
  )
}
