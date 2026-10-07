import type { MetadataRoute } from 'next'
import prisma from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://aihorizon-omega.vercel.app'

  // Fetch all events and workshops from the database
  const [events, workshops] = await Promise.all([
    prisma.event.findMany({
      select: { id: true, updatedAt: true },
    }),
    prisma.workshop.findMany({
      select: { id: true, updatedAt: true },
    }),
  ])

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/events`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/workshops`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/awards`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  // Dynamic event routes
  const eventRoutes: MetadataRoute.Sitemap = events.map((event) => ({
    url: `${baseUrl}/events/${event.id}`,
    lastModified: event.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  // Dynamic workshop routes
  const workshopRoutes: MetadataRoute.Sitemap = workshops.map((workshop) => ({
    url: `${baseUrl}/workshops/${workshop.id}`,
    lastModified: workshop.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  return [...staticRoutes, ...eventRoutes, ...workshopRoutes]
}
