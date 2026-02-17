'use client'

import React from 'react'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught:', error, info)

    // Report to CrashCatcher via server proxy (fire-and-forget)
    fetch('/api/report-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: error.message,
        description: `${error.stack || ''}\n\nComponent stack:${info.componentStack || ''}`,
        severity: 'CRITICAL',
        source: 'react_error',
      }),
    }).catch(() => {})
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full text-center">
            <div className="text-6xl mb-4">:/</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Något gick fel
            </h1>
            <p className="text-gray-600 mb-6">
              Ett oväntat fel inträffade. Vi har fått en rapport och tittar på det.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
            >
              Ladda om sidan
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
