'use client'

import { POSTER_SIZES } from '@/lib/image/resize'

interface SizePickerProps {
  selectedSizeId: string
  onSelect: (sizeId: string) => void
}

export default function SizePicker({ selectedSizeId, onSelect }: SizePickerProps) {
  const maxCm = Math.max(...POSTER_SIZES.map(s => Math.max(s.widthCm, s.heightCm)))
  const maxPreviewH = 64

  return (
    <div className="w-full">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Välj storlek</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {POSTER_SIZES.map((size) => {
          const scaleFactor = size.heightCm / maxCm
          const previewH = Math.round(maxPreviewH * scaleFactor)
          const previewW = Math.round(previewH * (size.widthCm / size.heightCm))

          return (
            <button
              key={size.id}
              onClick={() => onSelect(size.id)}
              className={`
                relative rounded-xl p-3 border-2 transition-all duration-200 text-left
                ${selectedSizeId === size.id
                  ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center flex-shrink-0" style={{ width: 48, height: maxPreviewH }}>
                  <div
                    className={`rounded-[2px] ${selectedSizeId === size.id ? 'border-2 border-blue-400 bg-blue-50 shadow-sm' : 'border-2 border-gray-300 bg-gray-50'}`}
                    style={{ width: previewW, height: previewH }}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{size.label}</p>
                  <p className="text-xs text-gray-500">{size.priceCredits} credits</p>
                </div>
              </div>
              {selectedSizeId === size.id && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
