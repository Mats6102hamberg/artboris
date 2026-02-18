'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/i18n/context'

interface Message {
  id: string
  text: string
  sender: 'user' | 'boris'
  timestamp: string
  type?: 'story' | 'analysis' | 'trend' | 'opinion'
}

interface BorisArtChatProps {
  artworks?: any[]
  selectedArtwork?: any
  scannedItems?: any[]
  portfolio?: any[]
}

export default function BorisArtChat({ artworks, selectedArtwork, scannedItems, portfolio }: BorisArtChatProps) {
  const { t } = useTranslation()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: t('boris.artChat.greeting'),
      sender: 'boris',
      timestamp: new Date().toISOString(),
      type: 'opinion'
    }
  ])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const callBorisAI = async (action: string, data?: any, context?: any) => {
    setIsTyping(true)
    
    try {
      const response = await fetch('/api/boris-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data, ...context })
      })
      
      const result = await response.json()
      
      if (result.success) {
        const borisMessage: Message = {
          id: Date.now().toString(),
          text: result.response.message,
          sender: 'boris',
          timestamp: result.response.timestamp,
          type: result.response.type
        }
        
        setMessages(prev => [...prev, borisMessage])
      }
    } catch (error) {
      console.error('Boris AI error:', error)
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: t('boris.artChat.errorResponse'),
        sender: 'boris',
        timestamp: new Date().toISOString()
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleSendMessage = async () => {
    if (!inputText.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')

    await callBorisAI('chat', { 
      message: inputText,
      scannedItems,
      portfolio,
      selectedArtwork
    })
  }

  const handleQuickAction = async (action: string) => {
    let data: any = {}

    switch (action) {
      case 'generate-story':
        if (selectedArtwork) {
          data.artwork = selectedArtwork
        } else {
          const userMessage: Message = {
            id: Date.now().toString(),
            text: t('boris.artChat.selectArtworkFirst'),
            sender: 'boris',
            timestamp: new Date().toISOString(),
            type: 'opinion'
          }
          setMessages(prev => [...prev, userMessage])
          return
        }
        break

      case 'analyze-artworks':
        const allArtworks = [...(portfolio || []), ...(scannedItems || [])]
        if (allArtworks.length > 0) {
          data.artworks = allArtworks
        } else {
          const userMessage: Message = {
            id: Date.now().toString(),
            text: t('boris.artChat.needArtworks'),
            sender: 'boris',
            timestamp: new Date().toISOString(),
            type: 'opinion'
          }
          setMessages(prev => [...prev, userMessage])
          return
        }
        break

      case 'get-trends':
      case 'get-opinion':
        // These don't need additional data
        break
    }

    await callBorisAI(action, data)
  }

  const getMessageIcon = (type?: string) => {
    switch (type) {
      case 'story': return '📖'
      case 'analysis': return '📊'
      case 'trend': return '📈'
      case 'opinion': return '💭'
      default: return '🤖'
    }
  }

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'story': return 'text-purple-600'
      case 'analysis': return 'text-blue-600'
      case 'trend': return 'text-green-600'
      case 'opinion': return 'text-orange-600'
      default: return 'text-gray-500'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">BA</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{t('boris.artChat.title')}</h3>
            <p className="text-xs text-gray-500">{t('boris.artChat.subtitle')}</p>
          </div>
        </div>
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => handleQuickAction('generate-story')}
          disabled={!selectedArtwork}
          className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-sm hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          📖 {t('boris.artChat.story')}
        </button>
        <button
          onClick={() => handleQuickAction('analyze-artworks')}
          disabled={(!portfolio || portfolio.length === 0) && (!scannedItems || scannedItems.length === 0)}
          className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          📊 {t('boris.artChat.analyze')}
        </button>
        <button
          onClick={() => handleQuickAction('get-trends')}
          className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200"
        >
          📈 {t('boris.artChat.trends')}
        </button>
        <button
          onClick={() => handleQuickAction('get-opinion')}
          className="px-3 py-1 bg-orange-100 text-orange-700 rounded text-sm hover:bg-orange-200"
        >
          💭 {t('boris.artChat.opinion')}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] ${
                message.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              } rounded-lg px-4 py-2`}
            >
              <div className="flex items-start space-x-2">
                {message.sender === 'boris' && (
                  <span className="text-lg">{getMessageIcon(message.type)}</span>
                )}
                <div className="flex-1">
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  {message.type && (
                    <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-blue-200' : getTypeColor(message.type)}`}>
                      {message.type === 'story' ? t('boris.artChat.story') :
                       message.type === 'analysis' ? t('boris.artChat.analysis') :
                       message.type === 'trend' ? t('boris.artChat.trend') :
                       message.type === 'opinion' ? t('boris.artChat.opinion') : t('boris.artChat.answer')}
                    </p>
                  )}
                </div>
              </div>
              <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-blue-200' : 'text-gray-400'}`} style={message.sender === 'boris' ? { color: '#9ca3af' } : undefined}>
                {new Date(message.timestamp).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 rounded-lg px-4 py-2">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🤖</span>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex space-x-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder={t('boris.artChat.inputPlaceholder')}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
          disabled={isTyping}
        />
        <button
          onClick={handleSendMessage}
          disabled={!inputText.trim() || isTyping}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {t('boris.artChat.send')}
        </button>
      </div>
    </div>
  )
}
