'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', background: '#FAFAF8' }}>
        <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#111' }}>Något gick fel</h1>
          <p style={{ color: '#666', marginTop: '0.5rem', fontSize: '0.875rem' }}>
            {error?.message || 'Okänt fel'}
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
            Försök igen
          </button>
        </div>
      </body>
    </html>
  )
}
