export interface Room {
  id: string
  userId: string
  imageUrl: string
  thumbnailUrl: string
  wallCorners: WallCornerSet[]
  width: number
  height: number
  createdAt: string
}

export interface WallCornerSet {
  id: string
  corners: { x: number; y: number }[]
  label: string
}

export interface RoomUploadResponse {
  success: boolean
  room?: Room
  error?: string
}
