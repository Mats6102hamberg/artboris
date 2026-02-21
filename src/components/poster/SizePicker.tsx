'use client'

import { POSTER_SIZES } from '@/lib/image/resize'

interface SizePickerProps {
  selectedSizeId: string
  onSelect: (sizeId: string) => void
  imageWidth?: number
  imageHeight?: number
}

function getEffectiveDpi(imgW: number, imgH: number, sizeCmW: number, sizeCmH: number): number {
  const imgAspect = imgW / imgH
  const sizeAspect = sizeCmW / sizeCmH
  if (imgAspect > sizeAspect) {
    return Math.round(imgH / (sizeCmH / 2.54))
  }
  return Math.round(imgW / (sizeCmW / 2.54))
}

function dpiQuality(dpi: number): 'perfect' | 'good' | 'fair' | 'low' {
  if (dpi >= 250) return 'perfect'
  if (dpi >= 180) return 'good'
  if (dpi >= 120) return 'fair'
  return 'low'
}

export default function SizePicker({ selectedSizeId, onSelect, imageWidth, imageHeight }: SizePickerProps) {
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

          const hasDpi = imageWidth && imageHeight && imageWidth > 0 && imageHeight > 0
          const dpi = hasDpi ? getEffectiveDpi(imageWidth, imageHeight, size.widthCm, size.heightCm) : null
          const quality = dpi !== null ? dpiQuality(dpi) : null
          const isBlocked = quality === 'low'
          const isFair = quality === 'fair'

          const qualityBadge = quality === 'perfect' ? { label: '✓', cls: 'bg-green-100 text-green-700' }
            : quality === 'good' ? { label: '○', cls: 'bg-blue-100 text-blue-700' }
            : quality === 'fair' ? { label: '⚠', cls: 'bg-amber-100 text-amber-700' }
            : quality === 'low' ? { label: '✕', cls: 'bg-red-100 text-red-600' }
            : null

          return (
            <button
              key={size.id}
              onClick={() => !isBlocked && onSelect(size.id)}
              disabled={isBlocked}
              className={`
                relative rounded-xl p-2 border-2 transition-all duration-200 overflow-hidden
                ${isBlocked
                  ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                  : selectedSizeId === size.id
                    ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50'
                    : isFair
                      ? 'border-amber-200 hover:border-amber-300 bg-amber-50/30'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                }
              `}
            >
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex items-center justify-center flex-shrink-0" style={{ width: 40, height: maxPreviewH }}>
                  <div
                    className={`rounded-[2px] ${isBlocked ? 'border-2 border-gray-200 bg-gray-100' : selectedSizeId === size.id ? 'border-2 border-blue-400 bg-blue-50 shadow-sm' : 'border-2 border-gray-300 bg-gray-50'}`}
                    style={{ width: previewW, height: previewH }}
                  />
                </div>
                <div className="text-center w-full">
                  <p className={`text-[11px] font-semibold leading-tight ${isBlocked ? 'text-gray-400' : 'text-gray-900'}`}>{name}</p>
                  {dims && <p className={`text-[9px] leading-tight ${isBlocked ? 'text-gray-300' : 'text-gray-500'}`}>{dims}</p>}
                  {qualityBadge && (
                    <span className={`inline-block mt-0.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full ${qualityBadge.cls}`}>
                      {qualityBadge.label} {dpi} DPI
                    </span>
                  )}
                  {!qualityBadge && (
                    <p className="text-[9px] text-gray-400 mt-0.5">{size.priceCredits} credits</p>
                  )}
                </div>
              </div>
              {selectedSizeId === size.id && !isBlocked && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              {isBlocked && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-px bg-red-300 rotate-[-20deg]" />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
