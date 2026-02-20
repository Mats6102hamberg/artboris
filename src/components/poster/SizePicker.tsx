'use client'

import { POSTER_SIZES } from '@/lib/image/resize'

interface SizePickerProps {
  selectedSizeId: string
  onSelect: (sizeId: string) => void
}

export default function SizePicker({ selectedSizeId, onSelect }: SizePickerProps) {
  const maxCm = Math.max(...POSTER_SIZES.map(s => Math.max(s.widthCm, s.heightCm)))
  const maxPreviewH = 64

  const formatLabel = (label: string) => {
    const match = label.match(/^(A\d)\s*\((.+)\)$/)
    if (match) return { name: match[1], dims: match[2] }
    return { name: label, dims: '' }
  }

  return (
    <div className="w-full">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Välj storlek</h3>
      <div className="grid grid-cols-4 gap-2">
        {POSTER_SIZES.map((size) => {
          const scaleFactor = size.heightCm / maxCm
          const previewH = Math.round(maxPreviewH * scaleFactor)
          const previewW = Math.round(previewH * (size.widthCm / size.heightCm))
          const { name, dims } = formatLabel(size.label)

          return (
            <button
              key={size.id}
              onClick={() => onSelect(size.id)}
              className={`
                relative rounded-xl p-2 border-2 transition-all duration-200 overflow-hidden
                ${selectedSizeId === size.id
                  ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
                }
              `}
            >
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex items-center justify-center flex-shrink-0" style={{ width: 40, height: maxPreviewH }}>
                  <div
                    className={`rounded-[2px] ${selectedSizeId === size.id ? 'border-2 border-blue-400 bg-blue-50 shadow-sm' : 'border-2 border-gray-300 bg-gray-50'}`}
                    style={{ width: previewW, height: previewH }}
                  />
                </div>
                <div className="text-center w-full">
                  <p className="text-[11px] font-semibold text-gray-900 leading-tight">{name}</p>
                  {dims && <p className="text-[9px] text-gray-500 leading-tight">{dims}</p>}
                  <p className="text-[9px] text-gray-400 mt-0.5">{size.priceCredits} credits</p>
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
