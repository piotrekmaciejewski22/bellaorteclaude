import type { MetadataRoute } from 'next';

import { createServiceClient } from '@/lib/supabase/admin';
import { getApartments } from '@/lib/data/apartments';
import { getBlogPosts } from '@/lib/data/blog';
import { getAttractions } from '@/lib/data/attractions';
import { getRestaurants } from '@/lib/data/restaurants';
import { getEvents } from '@/lib/data/events';

const STATIC_PATHS = [
  '',
  '/apartments',
  '/guide',
  '/blog',
  '/wasze-zdjecia',
  '/restaurants',
  '/places',
  '/rome',
  '/rome/info',
  '/rome/itinerary',
  '/rome/places',
  '/rome/restaurants',
  '/useful-info',
  '/wydarzenia',
  '/mapa',
  '/booking',
  '/privacy',
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bellaorte.example';
  const lastModified = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified,
    changeFrequency: 'weekly',
    priority: path === '' ? 1.0 : 0.7,
  }));

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return staticEntries;
  }

  try {
    const client = createServiceClient();
    const [apartments, posts, attractions, restaurants, events] = await Promise.all([
      getApartments(client).catch(() => []),
      getBlogPosts(client, { limit: 200 }).catch(() => []),
      getAttractions(client).catch(() => []),
      getRestaurants(client).catch(() => []),
      getEvents(client, { limit: 100 }).catch(() => []),
    ]);

    const dynamicEntries: MetadataRoute.Sitemap = [
      ...apartments.map((a) => ({
        url: `${baseUrl}/apartments/${a.slug}`,
        lastModified,
        changeFrequency: 'monthly' as const,
        priority: 0.8,
      })),
      ...posts.map((p) => ({
        url: `${baseUrl}/blog/${p.slug}`,
        lastModified: p.publishedAt ? new Date(p.publishedAt) : lastModified,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      })),
      ...attractions.map((a) => ({
        url: `${baseUrl}/places/${a.slug}`,
        lastModified,
        changeFrequency: 'monthly' as const,
        priority: 0.5,
      })),
      ...restaurants.map((r) => ({
        url: `${baseUrl}/restaurants/${r.slug}`,
        lastModified,
        changeFrequency: 'monthly' as const,
        priority: 0.5,
      })),
      ...(events.length > 0
        ? [
            {
              url: `${baseUrl}/wydarzenia`,
              lastModified,
              changeFrequency: 'weekly' as const,
              priority: 0.6,
            },
          ]
        : []),
    ];

    return [...staticEntries, ...dynamicEntries];
  } catch (err) {
    console.warn('sitemap dynamic generation failed:', err);
    return staticEntries;
  }
}
