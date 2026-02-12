export type OrderStatus =
  | 'pending'
  | 'rendering'
  | 'rendered'
  | 'printing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export interface Order {
  id: string
  userId: string
  designId: string
  variantId: string
  frameId: string
  sizeId: string
  finalRenderUrl: string | null
  status: OrderStatus
  creditsSpent: number
  shippingAddress: ShippingAddress | null
  createdAt: string
  updatedAt: string
}

export interface ShippingAddress {
  name: string
  street: string
  city: string
  postalCode: string
  country: string
  phone: string
}

export interface CreditBalance {
  userId: string
  balance: number
  totalPurchased: number
  totalSpent: number
}

export interface CreditTransaction {
  id: string
  userId: string
  amount: number
  type: 'purchase' | 'spend' | 'refund'
  description: string
  orderId: string | null
  createdAt: string
}

export interface CreditPackage {
  id: string
  label: string
  credits: number
  priceSEK: number
  popular: boolean
}
