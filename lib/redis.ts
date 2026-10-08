import 'server-only'

// Minimal Upstash Redis client over its REST API — one pipeline call per
// request, no SDK dependency. Vercel's Upstash integration sets the KV_*
// names; a manually created Upstash database uses the UPSTASH_* ones.

function config() {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN
  return url && token ? { url, token } : null
}

export function redisEnabled(): boolean {
  return config() !== null
}

export async function redisPipeline(commands: (string | number)[][]): Promise<unknown[]> {
  const c = config()
  if (!c) throw new Error('Redis is not configured')
  const res = await fetch(`${c.url}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${c.token}` },
    body: JSON.stringify(commands),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Redis responded ${res.status}`)
  const out = (await res.json()) as { result?: unknown; error?: string }[]
  return out.map(r => {
    if (r.error) throw new Error(r.error)
    return r.result
  })
}
