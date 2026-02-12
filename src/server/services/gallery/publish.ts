import { prisma } from '@/lib/prisma'

export interface PublishInput {
  userId: string
  title: string
  description: string
  imageUrl: string
  mockupUrl: string
  style: string
  roomType?: string
  colorMood?: string
}

export interface PublishResult {
  success: boolean
  designId?: string
  error?: string
}

export async function publishToGallery(input: PublishInput): Promise<PublishResult> {
  try {
    const item = await prisma.design.create({
      data: {
        userId: input.userId,
        title: input.title,
        description: input.description,
        imageUrl: input.imageUrl,
        mockupUrl: input.mockupUrl,
        style: input.style,
        roomType: input.roomType,
        colorMood: input.colorMood,
        likesCount: 0,
        isPublic: true,
      },
    })

    return { success: true, designId: item.id }
  } catch (error) {
    console.error('[publishToGallery] Error:', error)
    return {
      success: false,
      error: 'Kunde inte publicera till galleriet.',
    }
  }
}

export async function unpublishFromGallery(designId: string, userId: string): Promise<PublishResult> {
  try {
    await prisma.design.updateMany({
      where: { id: designId, userId },
      data: { isPublic: false },
    })

    return { success: true, designId }
  } catch (error) {
    console.error('[unpublishFromGallery] Error:', error)
    return {
      success: false,
      error: 'Kunde inte avpublicera.',
    }
  }
}
