import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/links'

const ROUTES = ['/', '/quote', '/emoji', '/splash', '/endless']

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((path) => ({
    url: `${SITE_URL}${path === '/' ? '' : path}`,
    changeFrequency: 'daily',
    priority: path === '/' ? 1 : 0.8,
  }))
}
