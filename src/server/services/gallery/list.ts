import { prisma } from '@/lib/prisma'

export interface GalleryListOptions {
  style?: string
  limit?: number
  offset?: number
  sortBy?: 'recent' | 'popular'
  aiOnly?: boolean
}

export async function listGallery(options: GalleryListOptions = {}) {
  const { style, limit = 20, offset = 0, sortBy = 'recent' } = options

  const where: any = { isPublic: true }
  if (style) where.style = style
  if (options.aiOnly) where.isAiGenerated = true

  const orderBy = sortBy === 'popular'
    ? { likesCount: 'desc' as const }
    : { createdAt: 'desc' as const }

  const [items, total] = await Promise.all([
    prisma.design.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        style: true,
        likesCount: true,
        isAiGenerated: true,
        createdAt: true,
      },
    }),
    prisma.design.count({ where }),
  ])

  return { items, total, hasMore: offset + limit < total }
}

