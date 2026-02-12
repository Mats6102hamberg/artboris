'use client'

import { DesignControls, MoodType } from '@/types/design'
import { MOOD_LABELS } from '@/lib/prompts/styles'

interface ControlsPanelProps {
  controls: DesignControls
  onChange: (controls: DesignControls) => void
  onRefine?: () => void
  isRefining?: boolean
}

export default function ControlsPanel({
  controls,
  onChange,
  onRefine,
  isRefining = false,
}: ControlsPanelProps) {
  const update = (partial: Partial<DesignControls>) => {
    onChange({ ...controls, ...partial })
  }

  return (
    <div className="space-y-5">
      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Justera</h3>

      {/* Mood */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">Stämning</label>
        <div className="grid grid-cols-4 gap-1.5">
          {(Object.keys(MOOD_LABELS) as MoodType[]).map((mood) => (
            <button
              key={mood}
              onClick={() => update({ mood })}
              className={`
                px-2 py-1.5 rounded-lg text-xs font-medium transition-all
                ${controls.mood === mood
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
            >
              {MOOD_LABELS[mood]}
            </button>
          ))}
        </div>
      </div>

      {/* Contrast */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Kontrast: {controls.contrast}%
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={controls.contrast}
          onChange={(e) => update({ contrast: parseInt(e.target.value) })}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>

      {/* Brightness */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Ljusstyrka: {controls.brightness}%
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={controls.brightness}
          onChange={(e) => update({ brightness: parseInt(e.target.value) })}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>

      {/* Saturation */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Mättnad: {controls.saturation}%
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={controls.saturation}
          onChange={(e) => update({ saturation: parseInt(e.target.value) })}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>

      {/* Color palette */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">Färgpalett</label>
        <div className="flex gap-2">
          {controls.colorPalette.map((color, i) => (
            <div key={i} className="relative">
              <input
                type="color"
                value={color}
                onChange={(e) => {
                  const newPalette = [...controls.colorPalette]
                  newPalette[i] = e.target.value
                  update({ colorPalette: newPalette })
                }}
                className="w-8 h-8 rounded-lg cursor-pointer border border-gray-200"
              />
            </div>
          ))}
          {controls.colorPalette.length < 6 && (
            <button
              onClick={() => update({ colorPalette: [...controls.colorPalette, '#888888'] })}
              className="w-8 h-8 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-500"
            >
              +
            </button>
          )}
        </div>
      </div>

      {/* Text overlay */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Textöverlägg</label>
        <input
          type="text"
          value={controls.textOverlay}
          onChange={(e) => update({ textOverlay: e.target.value })}
          placeholder="Valfri text på postern..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          maxLength={100}
        />
        {controls.textOverlay && (
          <div className="mt-2 flex gap-1.5">
            {(['top', 'center', 'bottom', 'none'] as const).map((pos) => (
              <button
                key={pos}
                onClick={() => update({ textPosition: pos })}
                className={`
                  px-2 py-1 rounded text-xs transition-all
                  ${controls.textPosition === pos
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
              >
                {pos === 'top' ? 'Topp' : pos === 'center' ? 'Mitt' : pos === 'bottom' ? 'Botten' : 'Ingen'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Refine button */}
      {onRefine && (
        <button
          onClick={onRefine}
          disabled={isRefining}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          {isRefining ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              Förfinar...
            </span>
          ) : (
            'Förfina med nya inställningar'
          )}
        </button>
      )}
    </div>
  )
}
