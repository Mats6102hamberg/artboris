'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function CancelContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-12 max-w-md w-full text-center">
        <div className="text-6xl mb-4">😔</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Betalningen avbröts
        </h1>
        <p className="text-gray-600 mb-6">
          Ingen betalning har dragits. Du kan försöka igen eller fortsätta utforska.
        </p>

        {orderId && (
          <div className="bg-gray-50 rounded-lg p-3 mb-6">
            <p className="text-xs text-gray-500">Ordernummer</p>
            <p className="font-mono text-sm text-gray-800">{orderId}</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Link
            href="/poster-lab"
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors"
          >
            Tillbaka till Poster Lab
          </Link>
          <Link
            href="/poster-lab/gallery"
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition-colors"
          >
            Utforska galleriet
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function OrderCancelPage() {
  return (
    <Suspense>
      <CancelContent />
    </Suspense>
  )
}
