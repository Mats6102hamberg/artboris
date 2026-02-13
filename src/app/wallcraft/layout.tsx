'use client'

import { ReactNode } from 'react'
import { I18nProvider } from '@/lib/i18n/context'
import { CartProvider } from '@/lib/cart/CartContext'
import CartDrawer from '@/components/cart/CartDrawer'

export default function WallcraftLayout({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <CartProvider>
        {children}
        <CartDrawer />
      </CartProvider>
    </I18nProvider>
  )
}
