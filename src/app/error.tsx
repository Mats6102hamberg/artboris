'use client'

import { useTranslation } from '@/lib/i18n/context'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { t } = useTranslation()

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', background: '#FAFAF8', minHeight: '100vh' }}>
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#111' }}>{t('errors.somethingWentWrong')}</h1>
        <p style={{ color: '#666', marginTop: '0.5rem', fontSize: '0.875rem' }}>
          {error?.message || t('errors.unknownError')}
        </p>
        {error?.digest && (
          <p style={{ color: '#999', marginTop: '0.25rem', fontSize: '0.75rem' }}>
            Digest: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          style={{
            marginTop: '1.5rem',
            padding: '0.75rem 2rem',
            background: '#111',
            color: '#fff',
            border: 'none',
            borderRadius: '0.75rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          {t('errors.tryAgain')}
        </button>
      </div>
    </div>
  )
}
