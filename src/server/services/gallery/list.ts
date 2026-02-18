import { prisma } from '@/lib/prisma'

export interface GalleryListOptions {
  style?: string
  limit?: number
  offset?: number
  sortBy?: 'recent' | 'popular'
  aiOnly?: boolean
}

export interface GalleryListItem {
  id: string
  designId: string
  title: string
  description: string
  imageUrl: string
  thumbnailUrl?: string
  style: string
  likesCount: number
  isAiGenerated: boolean
  type: 'ai-variant' | 'design'
  createdAt: string
}

export async function listGallery(options: GalleryListOptions = {}) {
  const { style, limit = 20, offset = 0, sortBy = 'recent' } = options

  const designWhere: any = { isPublic: true }
  if (style) designWhere.style = style
  if (options.aiOnly) designWhere.isAiGenerated = true

  const orderBy = sortBy === 'popular'
    ? { design: { likesCount: 'desc' as const } }
    : { createdAt: 'desc' as const }

  // Query AI variants — each variant becomes its own gallery item
  const aiWhere: any = { design: { ...designWhere, isAiGenerated: true } }

  const [variants, variantCount] = await Promise.all([
    prisma.designVariant.findMany({
      where: aiWhere,
      orderBy,
      take: limit,
      skip: offset,
      select: {
        id: true,
        imageUrl: true,
        thumbnailUrl: true,
        createdAt: true,
        design: {
          select: {
            id: true,
            title: true,
            description: true,
            style: true,
            likesCount: true,
            isAiGenerated: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.designVariant.count({ where: aiWhere }),
  ])

  // Map variants to gallery items
  const aiItems: GalleryListItem[] = variants.map((v) => ({
    id: v.id,
    designId: v.design.id,
    title: v.design.title,
    description: v.design.description,
    imageUrl: v.imageUrl,
    thumbnailUrl: v.thumbnailUrl || v.imageUrl,
    style: v.design.style,
    likesCount: v.design.likesCount,
    isAiGenerated: true,
    type: 'ai-variant' as const,
    createdAt: v.design.createdAt.toISOString(),
  }))

  // Also include non-AI public designs (creative tools)
  let nonAiItems: GalleryListItem[] = []
  let nonAiCount = 0

  if (!options.aiOnly) {
    const nonAiWhere: any = { isPublic: true, isAiGenerated: false }
    if (style) nonAiWhere.style = style

    const nonAiOrderBy = sortBy === 'popular'
      ? { likesCount: 'desc' as const }
      : { createdAt: 'desc' as const }

    const [designs, count] = await Promise.all([
      prisma.design.findMany({
        where: nonAiWhere,
        orderBy: nonAiOrderBy,
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
      prisma.design.count({ where: nonAiWhere }),
    ])

    nonAiItems = designs.map((d) => ({
      id: d.id,
      designId: d.id,
      title: d.title,
      description: d.description,
      imageUrl: d.imageUrl,
      thumbnailUrl: d.imageUrl,
      style: d.style,
      likesCount: d.likesCount,
      isAiGenerated: false,
      type: 'design' as const,
      createdAt: d.createdAt.toISOString(),
    }))
    nonAiCount = count
  }

  // Merge and sort
  const items = [...aiItems, ...nonAiItems]
  if (sortBy === 'popular') {
    items.sort((a, b) => b.likesCount - a.likesCount)
  } else {
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  const total = variantCount + nonAiCount
  return { items: items.slice(0, limit), total, hasMore: offset + limit < total }
}
