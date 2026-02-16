import { prisma } from '@/lib/prisma'

export interface PublishInput {
  designId: string
  userId: string
}

export interface PublishResult {
  success: boolean
  designId?: string
  error?: string
}

export async function publishToGallery(input: PublishInput): Promise<PublishResult> {
  try {
    const result = await prisma.design.updateMany({
      where: { id: input.designId, userId: input.userId },
      data: { isPublic: true },
    })

    if (result.count === 0) {
      return { success: false, error: 'Design hittades inte eller tillhör inte dig.' }
    }

    return { success: true, designId: input.designId }
  } catch (error) {
    console.error('[publishToGallery] Error:', error)
    return { success: false, error: 'Kunde inte publicera till galleriet.' }
  }
}

export async function unpublishFromGallery(designId: string, userId: string): Promise<PublishResult> {
  try {
    const result = await prisma.design.updateMany({
      where: { id: designId, userId },
      data: { isPublic: false },
    })

    if (result.count === 0) {
      return { success: false, error: 'Design hittades inte eller tillhör inte dig.' }
    }

    return { success: true, designId }
  } catch (error) {
    console.error('[unpublishFromGallery] Error:', error)
    return { success: false, error: 'Kunde inte avpublicera.' }
  }
}
