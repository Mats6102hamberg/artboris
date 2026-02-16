'use client'

export default function PrintYourOwnError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Något gick fel</h1>
        <p className="text-sm text-red-600 mb-1">{error?.message || 'Okänt fel'}</p>
        {error?.digest && (
          <p className="text-xs text-gray-400 mb-4">Digest: {error.digest}</p>
        )}
        <pre className="text-left text-xs bg-gray-100 p-3 rounded-lg overflow-auto max-h-40 mb-4 text-gray-600">
          {error?.stack || 'No stack trace'}
        </pre>
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800"
        >
          Försök igen
        </button>
      </div>
    </div>
  )
}
