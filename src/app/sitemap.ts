import type { MetadataRoute } from 'next';
import { MARKETING_ROUTES, SITE } from '@/content/marketing/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return MARKETING_ROUTES.map((path) => ({
    url: `${SITE.url}${path === '/' ? '' : path}`,
    lastModified: now,
    changeFrequency: path === '/' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : path === '/privacy' || path === '/terms' ? 0.3 : 0.7,
  }));
}