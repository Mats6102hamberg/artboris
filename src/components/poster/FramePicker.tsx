'use client'

import { FRAME_OPTIONS } from '@/lib/pricing/prints'

interface FramePickerProps {
  selectedFrameId: string
  onSelect: (frameId: string) => void
}

export default function FramePicker({ selectedFrameId, onSelect }: FramePickerProps) {
  return (
    <div className="w-full">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Välj ram</h3>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {FRAME_OPTIONS.map((frame) => (
          <button
            key={frame.id}
            onClick={() => onSelect(frame.id)}
            className={`
              group relative rounded-xl p-3 border-2 transition-all duration-200
              ${selectedFrameId === frame.id
                ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
              }
            `}
          >
            <div className="flex flex-col items-center gap-2">
              {frame.id === 'none' ? (
                <div className="w-10 h-14 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              ) : (
                <div
                  className="w-10 h-14 rounded"
                  style={{
                    border: `3px solid ${frame.color}`,
                    backgroundColor: '#f9f9f9',
                  }}
                />
              )}
              <span className="text-xs font-medium text-gray-700">{frame.label}</span>
              {frame.priceMultiplier > 1 && (
                <span className="text-[10px] text-gray-500">
                  +{Math.round((frame.priceMultiplier - 1) * 100)}%
                </span>
              )}
            </div>
            {selectedFrameId === frame.id && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
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
