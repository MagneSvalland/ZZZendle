import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/links'

// /debug is a dev-only tool — before this, its image galleries rendered
// unconditionally for anyone (see DebugImageGrid.tsx), so a crawler hitting
// this URL alone burned ~150+ image requests against the Vercel edge-request
// quota for zero benefit to anyone. That's now also gated behind dev auth,
// but keeping well-behaved bots out of /debug and /api entirely is a cheap
// second layer.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/debug', '/api/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
