import { prisma } from '@/lib/prisma'

export interface GalleryListOptions {
  style?: string
  limit?: number
  offset?: number
  sortBy?: 'recent' | 'popular'
}

export async function listGallery(options: GalleryListOptions = {}) {
  const { style, limit = 20, offset = 0, sortBy = 'recent' } = options

  const where: any = { isPublished: true }
  if (style) where.style = style

  const orderBy = sortBy === 'popular'
    ? { likes: 'desc' as const }
    : { createdAt: 'desc' as const }

  const [items, total] = await Promise.all([
    prisma.galleryItem.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
    }),
    prisma.galleryItem.count({ where }),
  ])

  return { items, total, hasMore: offset + limit < total }
}

export async function likeGalleryItem(galleryItemId: string) {
  return prisma.galleryItem.update({
    where: { id: galleryItemId },
    data: { likes: { increment: 1 } },
  })
}
