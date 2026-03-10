import type { MetadataRoute } from 'next';
import { site } from '@/config/site';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: site.url,
      lastModified: new Date('2026-03-09'),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${site.url}/create`,
      lastModified: new Date('2026-03-09'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${site.url}/privacy`,
      lastModified: new Date('2026-03-09'),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${site.url}/terms`,
      lastModified: new Date('2026-03-09'),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ];
}
