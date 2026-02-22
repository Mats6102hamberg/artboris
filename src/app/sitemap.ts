import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // regenerate at most once per hour at runtime

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://artboris.se'

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/wallcraft`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/wallcraft/gallery`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/wallcraft/photo-transform`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/market`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/poster-lab`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
  ]

  // Dynamic market listing pages
  const listings = await prisma.artworkListing.findMany({
    where: { isPublic: true },
    select: { id: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  })

  const listingPages: MetadataRoute.Sitemap = listings.map((listing) => ({
    url: `${baseUrl}/market/${listing.id}`,
    lastModified: listing.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [...staticPages, ...listingPages]
}
