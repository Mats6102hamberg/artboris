import { prisma } from '@/lib/prisma'

export interface PublishInput {
  designId: string
  userId: string
  title: string
  description: string
  imageUrl: string
  mockupUrl: string
  style: string
}

export interface PublishResult {
  success: boolean
  galleryItemId?: string
  error?: string
}

export async function publishToGallery(input: PublishInput): Promise<PublishResult> {
  try {
    const item = await prisma.galleryItem.create({
      data: {
        designId: input.designId,
        userId: input.userId,
        title: input.title,
        description: input.description,
        imageUrl: input.imageUrl,
        mockupUrl: input.mockupUrl,
        style: input.style,
        likes: 0,
        isPublished: true,
      },
    })

    return { success: true, galleryItemId: item.id }
  } catch (error) {
    console.error('[publishToGallery] Error:', error)
    return {
      success: false,
      error: 'Kunde inte publicera till galleriet.',
    }
  }
}

export async function unpublishFromGallery(galleryItemId: string, userId: string): Promise<PublishResult> {
  try {
    await prisma.galleryItem.updateMany({
      where: { id: galleryItemId, userId },
      data: { isPublished: false },
    })

    return { success: true, galleryItemId }
  } catch (error) {
    console.error('[unpublishFromGallery] Error:', error)
    return {
      success: false,
      error: 'Kunde inte avpublicera.',
    }
  }
}
