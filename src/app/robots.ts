import type { MetadataRoute } from 'next';
import { SITE } from '@/content/marketing/site';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/dashboard', '/api/', '/onboarding', '/invite'],
        },
        sitemap: `${SITE.url}/sitemap.xml`,
    };
}
