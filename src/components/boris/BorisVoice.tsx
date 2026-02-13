'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface BorisVoiceProps {
  message: string | null
  className?: string
}

export default function BorisVoice({ message, className = '' }: BorisVoiceProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const prevMessage = useRef<string | null>(null)
  const typingTimer = useRef<NodeJS.Timeout | null>(null)
  const hideTimer = useRef<NodeJS.Timeout | null>(null)

  const clearTimers = useCallback(() => {
    if (typingTimer.current) clearInterval(typingTimer.current)
    if (hideTimer.current) clearTimeout(hideTimer.current)
  }, [])

  useEffect(() => {
    if (!message || message === prevMessage.current) return
    prevMessage.current = message

    clearTimers()
    setDisplayedText('')
    setIsVisible(true)
    setIsTyping(true)

    let charIndex = 0
    typingTimer.current = setInterval(() => {
      charIndex++
      setDisplayedText(message.slice(0, charIndex))
      if (charIndex >= message.length) {
        if (typingTimer.current) clearInterval(typingTimer.current)
        setIsTyping(false)

        // Auto-hide after 8 seconds
        hideTimer.current = setTimeout(() => {
          setIsVisible(false)
        }, 8000)
      }
    }, 28) // ~28ms per character for natural typing speed

    return clearTimers
  }, [message, clearTimers])

  if (!isVisible && !displayedText) return null

  return (
    <div
      className={`transition-all duration-500 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
      } ${className}`}
    >
      <div className="relative bg-white/90 backdrop-blur-md border border-gray-200/60 rounded-2xl px-4 py-3 shadow-lg max-w-sm">
        {/* Boris avatar + name */}
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-bold text-white">B</span>
          </div>
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Boris</span>
          {isTyping && (
            <span className="flex gap-0.5 ml-1">
              <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          )}
        </div>

        {/* Message text */}
        <p className="text-sm text-gray-700 leading-relaxed">
          {displayedText}
          {isTyping && <span className="inline-block w-0.5 h-4 bg-gray-400 ml-0.5 animate-pulse align-middle" />}
        </p>

        {/* Dismiss button */}
        {!isTyping && isVisible && (
          <button
            onClick={() => setIsVisible(false)}
            className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded-full text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Speech bubble tail */}
        <div className="absolute -bottom-1.5 left-6 w-3 h-3 bg-white/90 border-b border-r border-gray-200/60 transform rotate-45" />
      </div>
    </div>
  )
}
