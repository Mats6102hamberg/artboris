'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslation } from '@/lib/i18n/context'

interface BorisButtonProps {
  /** Which Boris context to use */
  action?: 'style' | 'variant' | 'editor' | 'print' | 'chat'
  /** Extra context to send to Boris (room info, size, frame, etc.) */
  context?: Record<string, any>
  /** Quick-ask suggestions shown as chips */
  suggestions?: string[]
  /** Position: bottom-right (default) or inline */
  variant?: 'floating' | 'inline'
  /** Optional label override */
  label?: string
}

interface Message {
  id: string
  text: string
  sender: 'user' | 'boris'
  timestamp: string
}

export default function BorisButton({
  action = 'chat',
  context,
  suggestions,
  variant = 'floating',
  label,
}: BorisButtonProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMsg: Message = {
      id: `u_${Date.now()}`,
      text: text.trim(),
      sender: 'user',
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/boris/wallcraft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, message: text.trim(), context }),
      })

      const data = await res.json()

      const borisMsg: Message = {
        id: `b_${Date.now()}`,
        text: data.success
          ? data.response.message
          : t('boris.errorResponse'),
        sender: 'boris',
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, borisMsg])
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: `e_${Date.now()}`,
          text: t('boris.networkError'),
          sender: 'boris',
          timestamp: new Date().toISOString(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  // ─── Floating button (FAB) ────────────────────────────────────────────────
  if (variant === 'floating') {
    return (
      <>
        {/* FAB */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`fixed bottom-6 right-6 z-50 flex items-center justify-center transition-all duration-300 ${
            isOpen
              ? 'w-14 h-14 rounded-full bg-gray-900 text-white scale-90'
              : 'h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 hover:scale-105 w-14 lg:w-auto lg:gap-2.5 lg:px-5 lg:rounded-2xl'
          }`}
          title={t('boris.askBoris')}
        >
          {isOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <>
              <span className="text-xl font-bold">B</span>
              <span className="hidden lg:inline text-sm font-semibold">{t('boris.askBoris')}</span>
            </>
          )}
        </button>

        {/* Panel */}
        {isOpen && (
          <div className="fixed bottom-24 right-6 z-50 w-[380px] max-h-[520px] bg-white rounded-2xl shadow-2xl border border-gray-200/60 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4">
            {renderPanel()}
          </div>
        )}
      </>
    )
  }

  // ─── Inline button ────────────────────────────────────────────────────────
  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
          isOpen
            ? 'bg-gray-900 text-white'
            : 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-900 border border-amber-300 hover:border-amber-400 hover:shadow-md shadow-sm'
        }`}
      >
        <span className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
          B
        </span>
        {label || t('boris.askBoris')}
      </button>

      {isOpen && (
        <div className="mt-3 w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-200/60 flex flex-col overflow-hidden" style={{ maxHeight: '460px' }}>
          {renderPanel()}
        </div>
      )}
    </>
  )

  // ─── Shared panel renderer ────────────────────────────────────────────────
  function renderPanel() {
    return (
      <>
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3 flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">B</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">Boris</p>
            <p className="text-[11px] text-gray-400">{t('boris.subtitle')}</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ minHeight: '200px' }}>
          {messages.length === 0 && !isLoading && (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mx-auto mb-3">
                <span className="text-amber-600 text-lg font-bold">B</span>
              </div>
              <p className="text-sm text-gray-500 mb-1">{t('boris.greeting')}</p>
              <p className="text-xs text-gray-400">
                {action === 'style' && t('boris.actionStyle')}
                {action === 'editor' && t('boris.actionEditor')}
                {action === 'print' && t('boris.actionPrint')}
                {action === 'variant' && t('boris.actionVariant')}
                {action === 'chat' && t('boris.actionChat')}
              </p>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-gray-900 text-white rounded-br-md'
                    : 'bg-gray-50 text-gray-800 border border-gray-100 rounded-bl-md'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {messages.length === 0 && suggestions && suggestions.length > 0 && (
          <div className="px-4 pb-2 flex flex-wrap gap-1.5 flex-shrink-0">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => sendMessage(s)}
                disabled={isLoading}
                className="px-3 py-1.5 text-xs bg-amber-50 text-amber-700 rounded-full border border-amber-200/60 hover:bg-amber-100 hover:border-amber-300 transition-colors disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-3 py-3 border-t border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('boris.inputPlaceholder')}
              disabled={isLoading}
              className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-colors disabled:opacity-50"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white hover:shadow-md disabled:opacity-30 disabled:hover:shadow-none transition-all flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </>
    )
  }
}
