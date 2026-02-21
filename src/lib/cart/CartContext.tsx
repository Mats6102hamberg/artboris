'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export interface CartItem {
  id: string
  designId: string
  variantId: string
  imageUrl: string
  roomImageUrl: string | null
  style: string
  prompt: string
  sizeId: string
  sizeLabel: string
  widthCm: number
  heightCm: number
  frameId: string
  frameLabel: string
  frameColor: string
  basePriceSEK: number
  framePriceSEK: number
  matEnabled: boolean
  acrylicGlass: boolean
  matPriceSEK: number
  acrylicPriceSEK: number
  screws?: boolean
  screwdriver?: boolean
  accessoriesPriceSEK?: number
  needsUpscaling?: boolean
  imageWidth?: number
  imageHeight?: number
  totalPriceSEK: number
  quantity: number
}

interface CartContextType {
  items: CartItem[]
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  addItem: (item: Omit<CartItem, 'id' | 'quantity'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  updateItemAddons: (id: string, addons: { matEnabled: boolean; acrylicGlass: boolean; matPriceSEK: number; acrylicPriceSEK: number; totalPriceSEK: number }) => void
  clearCart: () => void
  totalItems: number
  totalPriceSEK: number
}

const CartContext = createContext<CartContextType | null>(null)

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)

  const addItem = useCallback((item: Omit<CartItem, 'id' | 'quantity'>) => {
    const id = `cart_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    setItems(prev => [...prev, { ...item, id, quantity: 1 }])
    setIsOpen(true)
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }, [])

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity < 1) return
    setItems(prev => prev.map(item => item.id === id ? { ...item, quantity } : item))
  }, [])

  const updateItemAddons = useCallback((id: string, addons: { matEnabled: boolean; acrylicGlass: boolean; matPriceSEK: number; acrylicPriceSEK: number; totalPriceSEK: number }) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...addons } : item))
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPriceSEK = items.reduce((sum, item) => sum + item.totalPriceSEK * item.quantity, 0)

  return (
    <CartContext.Provider value={{ items, isOpen, setIsOpen, addItem, removeItem, updateQuantity, updateItemAddons, clearCart, totalItems, totalPriceSEK }}>
      {children}
    </CartContext.Provider>
  )
}
