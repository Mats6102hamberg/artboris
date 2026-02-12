'use client'

import { useState, useEffect } from 'react'

interface Variant {
  id: string
  imageUrl: string
  thumbnailUrl: string
  isSelected: boolean
}

interface ImageControls {
  contrast: number
  brightness: number
  saturation: number
  zoom?: number  // 100–200
}

interface VariantsGridProps {
  variants: Variant[]
  selectedIndex: number | null
  onSelect: (index: number) => void
  isLoading?: boolean
  controls?: ImageControls
}

export default function VariantsGrid({
  variants,
  selectedIndex,
  onSelect,
  isLoading = false,
  controls,
}: VariantsGridProps) {
  const [viewIndex, setViewIndex] = useState(0)

  // Auto-select first variant when variants load
  useEffect(() => {
    if (variants.length > 0 && selectedIndex === null) {
      onSelect(0)
    }
  }, [variants.length])

  // CSS filter + zoom from controls (50 = neutral for filters, 100 = normal zoom)
  const zoomScale = controls?.zoom ? controls.zoom / 100 : 1
  const filterStyle = controls
    ? {
        filter: [
          `contrast(${0.5 + (controls.contrast / 100)})`,
          `brightness(${0.5 + (controls.brightness / 100)})`,
          `saturate(${0.5 + (controls.saturation / 100)})`,
        ].join(' '),
        transform: `scale(${zoomScale})`,
        transition: 'filter 0.3s ease, transform 0.3s ease',
      }
    : {}

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="aspect-[2/3] rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 animate-pulse flex items-center justify-center">
            <div className="text-center">
              <div className="relative w-12 h-12 mx-auto">
                <div className="absolute inset-0 rounded-full border-2 border-blue-200" />
                <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
              </div>
              <p className="text-xs text-gray-400 mt-4 font-medium">Skapar variant {i + 1}...</p>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (variants.length === 0) {
    return (
      <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border border-gray-100">
        <div className="text-5xl mb-4">🎨</div>
        <p className="text-gray-500 font-medium">Inga varianter genererade ännu.</p>
        <p className="text-sm text-gray-400 mt-1">Välj stil och klicka Generera.</p>
      </div>
    )
  }

  const goPrev = () => {
    const next = (viewIndex - 1 + variants.length) % variants.length
    setViewIndex(next)
    onSelect(next)
  }
  const goNext = () => {
    const next = (viewIndex + 1) % variants.length
    setViewIndex(next)
    onSelect(next)
  }

  const variant = variants[viewIndex]

  return (
    <>
      <div className="relative">
        {/* Main image */}
        <div
          className={`
            relative aspect-[2/3] rounded-2xl overflow-hidden border-2 transition-all duration-300
            ${selectedIndex === viewIndex
              ? 'border-blue-500 ring-4 ring-blue-100 shadow-xl shadow-blue-100'
              : 'border-gray-200 shadow-lg'
            }
          `}
        >
          <img
            key={viewIndex}
            src={variant.thumbnailUrl || variant.imageUrl}
            alt={`Variant ${viewIndex + 1}`}
            className="w-full h-full object-cover animate-fadeIn"
            style={filterStyle}
          />

          {/* Selected badge */}
          {selectedIndex === viewIndex && (
            <div className="absolute top-4 right-4 bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-scaleIn">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              Vald
            </div>
          )}

          {/* Prev / Next arrows */}
          <button
            onClick={goPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Counter badge */}
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white text-sm font-medium px-3 py-1.5 rounded-full">
            {viewIndex + 1} / {variants.length}
          </div>
        </div>

        {/* Dot indicators + thumbnails */}
        <div className="flex items-center justify-center gap-3 mt-4">
          {variants.map((v, i) => (
            <button
              key={v.id}
              onClick={() => { setViewIndex(i); onSelect(i) }}
              className={`
                relative rounded-lg overflow-hidden border-2 transition-all duration-200
                ${i === viewIndex
                  ? 'border-blue-500 ring-2 ring-blue-200 scale-110'
                  : selectedIndex === i
                    ? 'border-blue-300 opacity-80 hover:opacity-100'
                    : 'border-gray-200 opacity-60 hover:opacity-100'
                }
              `}
              style={{ width: 52, height: 72 }}
            >
              <img
                src={v.thumbnailUrl || v.imageUrl}
                alt={`Variant ${i + 1}`}
                className="w-full h-full object-cover"
              />
              {selectedIndex === i && (
                <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>

      </div>

      <style jsx>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.35s ease-out;
        }
      `}</style>
    </>
  )
}
