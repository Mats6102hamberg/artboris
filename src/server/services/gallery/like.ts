import { prisma } from '@/lib/prisma'

export interface LikeResult {
  liked: boolean
  likesCount: number
}

/**
 * Toggle like: om redan gillad → ta bort, annars → skapa.
 * Använder Prisma-transaktion för att hålla likesCount synkad.
 */
export async function toggleLike(designId: string, anonId: string): Promise<LikeResult> {
  const existing = await prisma.like.findUnique({
    where: { designId_anonId: { designId, anonId } },
  })

  if (existing) {
    // Unlike — transaktion: ta bort like + minska räknare
    const [, updated] = await prisma.$transaction([
      prisma.like.delete({ where: { id: existing.id } }),
      prisma.design.update({
        where: { id: designId },
        data: { likesCount: { decrement: 1 } },
      }),
    ])
    return { liked: false, likesCount: Math.max(0, updated.likesCount) }
  }

  // Like — transaktion: skapa like + öka räknare
  const [, updated] = await prisma.$transaction([
    prisma.like.create({ data: { designId, anonId } }),
    prisma.design.update({
      where: { id: designId },
      data: { likesCount: { increment: 1 } },
    }),
  ])
  return { liked: true, likesCount: updated.likesCount }
}

/**
 * Ta bort en specifik like (explicit unlike).
 */
export async function removeLike(designId: string, anonId: string): Promise<LikeResult> {
  const existing = await prisma.like.findUnique({
    where: { designId_anonId: { designId, anonId } },
  })

  if (!existing) {
    // Inte gillad — returnera nuvarande count
    const design = await prisma.design.findUnique({ where: { id: designId } })
    return { liked: false, likesCount: design?.likesCount ?? 0 }
  }

  const [, updated] = await prisma.$transaction([
    prisma.like.delete({ where: { id: existing.id } }),
    prisma.design.update({
      where: { id: designId },
      data: { likesCount: { decrement: 1 } },
    }),
  ])
  return { liked: false, likesCount: Math.max(0, updated.likesCount) }
}

/**
 * Kolla om en specifik anonId har gillat en design.
 */
export async function hasLiked(designId: string, anonId: string): Promise<boolean> {
  const existing = await prisma.like.findUnique({
    where: { designId_anonId: { designId, anonId } },
  })
  return !!existing
}
