'use client'

import { StylePreset, StyleDefinition } from '@/types/design'
import { getBorisStyles, getRegularStyles } from '@/lib/prompts/styles'

interface StylePickerProps {
  selectedStyle: StylePreset | null
  onSelect: (style: StylePreset) => void
}

export default function StylePicker({ selectedStyle, onSelect }: StylePickerProps) {
  const borisStyles = getBorisStyles()
  const regularStyles = getRegularStyles()

  return (
    <div className="w-full">
      {/* Boris Collection */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Boris Collection</h3>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
            Fine Art
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
          {borisStyles.map((style) => (
            <button
              key={style.id}
              onClick={() => onSelect(style.id)}
              className={`
                group relative rounded-xl overflow-hidden border-2 transition-all duration-200 active:scale-95
                ${selectedStyle === style.id
                  ? 'border-amber-500 ring-2 ring-amber-200 scale-[1.02]'
                  : 'border-amber-200/60 hover:border-amber-300 hover:shadow-md'
                }
              `}
            >
              <div className="aspect-[3/4] flex items-center justify-center">
                <div
                  className="w-full h-full flex items-center justify-center p-2"
                  style={{
                    background: `linear-gradient(135deg, ${style.defaultColors[0]}, ${style.defaultColors[1] || style.defaultColors[0]})`,
                  }}
                >
                  <span className="text-2xl sm:text-2xl opacity-80">
                    {getStyleEmoji(style.id)}
                  </span>
                </div>
              </div>
              <div className="p-1.5 sm:p-2 bg-gradient-to-r from-amber-50 to-white">
                <p className="text-[11px] sm:text-xs font-medium text-gray-900 truncate">{style.label}</p>
                <p className="text-[9px] sm:text-[10px] text-gray-500 truncate hidden sm:block">{style.description}</p>
              </div>
              {selectedStyle === style.id && (
                <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Regular Styles */}
      <h3 className="text-sm font-medium text-gray-700 mb-3">Alla stilar ({regularStyles.length} stilar)</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
        {regularStyles.map((style) => (
          <button
            key={style.id}
            onClick={() => onSelect(style.id)}
            className={`
              group relative rounded-xl overflow-hidden border-2 transition-all duration-200 active:scale-95
              ${selectedStyle === style.id
                ? 'border-blue-500 ring-2 ring-blue-200 scale-[1.02]'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
              }
            `}
          >
            <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <div
                className="w-full h-full flex items-center justify-center p-2"
                style={{
                  background: `linear-gradient(135deg, ${style.defaultColors[0]}, ${style.defaultColors[1] || style.defaultColors[0]})`,
                }}
              >
                <span className="text-2xl sm:text-2xl opacity-80">
                  {getStyleEmoji(style.id)}
                </span>
              </div>
            </div>
            <div className="p-1.5 sm:p-2 bg-white">
              <p className="text-[11px] sm:text-xs font-medium text-gray-900 truncate">{style.label}</p>
              <p className="text-[9px] sm:text-[10px] text-gray-500 truncate hidden sm:block">{style.description}</p>
            </div>
            {selectedStyle === style.id && (
              <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

function getStyleEmoji(style: StylePreset): string {
  const emojis: Record<StylePreset, string> = {
    nordic: '🌿',
    retro: '📻',
    minimal: '◻️',
    abstract: '🎨',
    botanical: '🌸',
    geometric: '🔷',
    watercolor: '💧',
    'line-art': '✏️',
    photography: '📷',
    typographic: '🔤',
    'pop-art': '💥',
    japanese: '🌸',
    'art-deco': '✨',
    surreal: '👁️',
    graffiti: '🎤',
    pastel: '🧁',
    'dark-moody': '🌑',
    'mid-century': '💎',
    'boris-silence': '🤫',
    'boris-between': '🌗',
    'boris-awakening': '🌅',
  }
  return emojis[style] || '🎨'
}
