'use client'

import { ReactNode } from 'react'
import { CartProvider } from '@/lib/cart/CartContext'
import CartDrawer from '@/components/cart/CartDrawer'

export default function WallcraftLayout({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      {children}
      <CartDrawer />
    </CartProvider>
  )
}
