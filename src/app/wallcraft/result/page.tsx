'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n/context'
import Button from '@/components/ui/Button'

function ResultContent() {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const designId = searchParams.get('designId')

  if (!designId) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">{t('common.error')}</p>
          <Button variant="ghost" className="mt-4" onClick={() => router.push('/wallcraft/studio')}>
            ← {t('common.back')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <nav className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <a href="/wallcraft" className="text-lg font-semibold tracking-widest uppercase text-gray-900">
          {t('brand.name')}
        </a>
      </nav>
      <div className="max-w-3xl mx-auto px-6 py-12 text-center">
        <h1 className="text-2xl font-light text-gray-900">{t('studio.editor.variants')}</h1>
        <p className="mt-2 text-gray-500">Design ID: {designId}</p>
        <p className="mt-8 text-sm text-gray-400">Result page — redirects to /wallcraft/design/[id]</p>
        <Button className="mt-6" onClick={() => router.push(`/wallcraft/design/${designId}`)}>
          {t('studio.editor.frame')} →
        </Button>
      </div>
    </div>
  )
}

export default function ResultPage() {
  return (
    <Suspense>
      <ResultContent />
    </Suspense>
  )
}
