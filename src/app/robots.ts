import type { MetadataRoute } from 'next';

/**
 * `/robots.txt` — pozwala wszystkim botom czytać stronę publiczną,
 * blokuje panel admina i endpointy API.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bellaorte.example';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
