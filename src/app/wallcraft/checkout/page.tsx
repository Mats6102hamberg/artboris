'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslation } from '@/lib/i18n/context'
import Button from '@/components/ui/Button'

function CheckoutContent() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const designId = searchParams.get('designId')

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <nav className="max-w-5xl mx-auto px-6 py-5">
        <a href="/wallcraft" className="text-lg font-semibold tracking-widest uppercase text-gray-900">
          {t('brand.name')}
        </a>
      </nav>
      <div className="max-w-lg mx-auto px-6 py-16 text-center">
        <h1 className="text-2xl font-light text-gray-900">{t('checkout.title')}</h1>
        <p className="mt-4 text-gray-500">Design: {designId || '—'}</p>
        <div className="mt-8 p-6 bg-white rounded-2xl border border-gray-200">
          <p className="text-sm text-gray-400">Checkout integration coming soon</p>
        </div>
        <Button className="mt-6" size="lg">
          {t('checkout.pay')}
        </Button>
        <p className="mt-3 text-xs text-gray-400">{t('checkout.secure')}</p>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutContent />
    </Suspense>
  )
}
