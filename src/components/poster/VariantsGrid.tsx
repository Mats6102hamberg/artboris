'use client'

import { useState } from 'react'

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
  // CSS filter string from controls (50 = neutral)
  const filterStyle = controls
    ? {
        filter: [
          `contrast(${0.5 + (controls.contrast / 100)})`,
          `brightness(${0.5 + (controls.brightness / 100)})`,
          `saturate(${0.5 + (controls.saturation / 100)})`,
        ].join(' '),
        transition: 'filter 0.3s ease',
      }
    : {}
  const [zoomedIndex, setZoomedIndex] = useState<number | null>(null)

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

  return (
    <>
      <div className="grid grid-cols-2 gap-5">
        {variants.map((variant, index) => (
          <button
            key={variant.id}
            onClick={() => onSelect(index)}
            onDoubleClick={() => setZoomedIndex(index)}
            className={`
              group relative aspect-[2/3] rounded-2xl overflow-hidden border-2 transition-all duration-300
              ${selectedIndex === index
                ? 'border-blue-500 ring-4 ring-blue-100 shadow-xl shadow-blue-100 scale-[1.02]'
                : 'border-gray-200 hover:border-blue-300 hover:shadow-lg hover:scale-[1.01]'
              }
            `}
          >
            <img
              src={variant.thumbnailUrl || variant.imageUrl}
              alt={`Variant ${index + 1}`}
              className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700 ease-out"
              style={filterStyle}
            />

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Selection indicator */}
            {selectedIndex === index ? (
              <div className="absolute top-3 right-3 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg animate-scaleIn">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <div className="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow">
                <span className="text-gray-500 text-xs font-bold">{index + 1}</span>
              </div>
            )}

            {/* Hover zoom hint */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-medium">
                Variant {index + 1}
              </span>
              <span className="bg-white/80 backdrop-blur-sm text-gray-600 text-xs px-2 py-1.5 rounded-full">
                Dubbelklicka för zoom
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Zoom lightbox */}
      {zoomedIndex !== null && variants[zoomedIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8 animate-fadeIn cursor-pointer"
          onClick={() => setZoomedIndex(null)}
        >
          <div className="relative max-w-2xl w-full max-h-[90vh] animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <img
              src={variants[zoomedIndex].imageUrl}
              alt={`Variant ${zoomedIndex + 1}`}
              className="w-full h-auto max-h-[85vh] object-contain rounded-2xl shadow-2xl"
              style={filterStyle}
            />
            <div className="absolute -top-4 -right-4 flex gap-2">
              <button
                onClick={() => { onSelect(zoomedIndex); setZoomedIndex(null) }}
                className="w-10 h-10 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg transition-colors"
                title="Välj denna"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button
                onClick={() => setZoomedIndex(null)}
                className="w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center text-gray-700 shadow-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white text-sm px-4 py-2 rounded-full">
              Variant {zoomedIndex + 1} av {variants.length}
            </div>
          </div>
        </div>
      )}

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
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </>
  )
}
