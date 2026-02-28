'use client'

import { useTranslation } from '@/lib/i18n/context'
import { type DemoWall } from '@/lib/demo/demoWalls'

interface WallSwitcherProps {
  walls: DemoWall[]
  selectedWallId: string | null
  onSelectWall: (wall: DemoWall) => void
  onSelectCustom: () => void
  customThumbnail?: string | null
}

export default function WallSwitcher({
  walls,
  selectedWallId,
  onSelectWall,
  onSelectCustom,
  customThumbnail,
}: WallSwitcherProps) {
  const { t } = useTranslation()

  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium text-gray-700 mb-2">{t('demoWalls.title')}</h3>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
        {walls.map((wall) => (
          <button
            key={wall.id}
            onClick={() => onSelectWall(wall)}
            className={`
              flex-shrink-0 rounded-xl border-2 transition-all duration-200 overflow-hidden
              ${selectedWallId === wall.id
                ? 'border-blue-500 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300'
              }
            `}
          >
            <div className="w-20 h-14 bg-gray-100 relative">
              <img
                src={wall.thumbnailUrl}
                alt={t(wall.labelKey)}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  const target = e.currentTarget
                  target.style.display = 'none'
                  target.parentElement!.classList.add('flex', 'items-center', 'justify-center')
                }}
              />
              <span className="absolute top-0.5 left-1 text-xs">{wall.emoji}</span>
            </div>
            <div className="px-1.5 py-1 bg-white">
              <span className="text-[10px] font-medium text-gray-600 whitespace-nowrap">{t(wall.labelKey)}</span>
            </div>
          </button>
        ))}

        {/* Custom wall button */}
        <button
          onClick={onSelectCustom}
          className={`
            flex-shrink-0 rounded-xl border-2 transition-all duration-200 overflow-hidden
            ${selectedWallId === null
              ? 'border-blue-500 ring-2 ring-blue-200'
              : 'border-gray-200 hover:border-gray-300 border-dashed'
            }
          `}
        >
          <div className="w-20 h-14 bg-gray-50 flex items-center justify-center relative">
            {customThumbnail ? (
              <img src={customThumbnail} alt={t('demoWalls.customWall')} className="w-full h-full object-cover" />
            ) : (
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </div>
          <div className="px-1.5 py-1 bg-white">
            <span className="text-[10px] font-medium text-gray-600 whitespace-nowrap">{t('demoWalls.customWall')}</span>
          </div>
        </button>
      </div>
    </div>
  )
}
