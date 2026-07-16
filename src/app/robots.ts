import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/dashboard/',
        '/me/',
        '/api/',
        '/register/',
        '/attendance/',
      ],
    },
    sitemap: 'https://aihorizon-omega.vercel.app/sitemap.xml',
  }
}
