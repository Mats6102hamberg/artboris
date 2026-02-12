import { prisma } from '@/lib/prisma'

export interface GalleryListOptions {
  style?: string
  limit?: number
  offset?: number
  sortBy?: 'recent' | 'popular'
}

export async function listGallery(options: GalleryListOptions = {}) {
  const { style, limit = 20, offset = 0, sortBy = 'recent' } = options

  const where: any = { isPublic: true }
  if (style) where.style = style

  const orderBy = sortBy === 'popular'
    ? { likesCount: 'desc' as const }
    : { createdAt: 'desc' as const }

  const [items, total] = await Promise.all([
    prisma.design.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
    }),
    prisma.design.count({ where }),
  ])

  return { items, total, hasMore: offset + limit < total }
}

export async function likeDesign(designId: string, anonId: string) {
  // Upsert: om like redan finns gör inget, annars skapa och öka räknaren
  const existing = await prisma.like.findUnique({
    where: { designId_anonId: { designId, anonId } },
  })

  if (existing) {
    // Redan gillad — ta bort like (toggle)
    await prisma.like.delete({ where: { id: existing.id } })
    await prisma.design.update({
      where: { id: designId },
      data: { likesCount: { decrement: 1 } },
    })
    return { liked: false }
  }

  await prisma.like.create({ data: { designId, anonId } })
  const updated = await prisma.design.update({
    where: { id: designId },
    data: { likesCount: { increment: 1 } },
  })

  return { liked: true, likesCount: updated.likesCount }
}
