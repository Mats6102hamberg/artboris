'use client'

import { getAddonPrice, getAccessoryPrice, formatSEK } from '@/lib/pricing/prints'

export interface AddonSelections {
  matEnabled: boolean
  acrylicGlass: boolean
  screws: boolean
  screwdriver: boolean
}

interface AddonsPanelProps {
  sizeId: string
  frameId: string
  selections: AddonSelections
  onChange: (selections: AddonSelections) => void
}

export default function AddonsPanel({ sizeId, frameId, selections, onChange }: AddonsPanelProps) {
  const matPrice = getAddonPrice('mat', sizeId)
  const acrylicPrice = getAddonPrice('acrylic', sizeId)
  const screwsPrice = getAccessoryPrice('screws')
  const screwdriverPrice = getAccessoryPrice('screwdriver')

  const hasFrame = frameId !== 'none'

  const toggle = (key: keyof AddonSelections) => {
    onChange({ ...selections, [key]: !selections[key] })
  }

  const addons = [
    {
      key: 'matEnabled' as const,
      label: 'Passepartout',
      description: 'Vit passepartout som ger djup och elegans',
      price: matPrice,
      icon: (
        <div className="w-8 h-11 border-2 border-gray-400 rounded-sm flex items-center justify-center">
          <div className="w-5 h-7 border border-gray-300 rounded-[1px] bg-gray-50" />
        </div>
      ),
      disabled: false,
    },
    {
      key: 'acrylicGlass' as const,
      label: 'Akrylglas',
      description: 'Skyddar motivet — lättare och säkrare än vanligt glas',
      price: acrylicPrice,
      icon: (
        <div className="w-8 h-11 rounded-sm bg-gradient-to-br from-white/80 via-blue-50/60 to-white/40 border border-blue-200/60 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-transparent" style={{ transform: 'rotate(-30deg) translateY(-2px)' }} />
        </div>
      ),
      disabled: !hasFrame,
      disabledNote: 'Kräver ram',
    },
  ]

  const accessories = [
    {
      key: 'screws' as const,
      label: 'Skruvar & plugg',
      description: 'Allt du behöver för att hänga tavlan',
      price: screwsPrice,
      icon: '🔩',
    },
    {
      key: 'screwdriver' as const,
      label: 'Skruvmejsel',
      description: 'Korsformad skruvmejsel — perfekt för upphängning',
      price: screwdriverPrice,
      icon: '🪛',
    },
  ]

  return (
    <div className="w-full space-y-4">
      <h3 className="text-sm font-medium text-gray-700">Tillval</h3>

      {/* Passepartout & Akrylglas */}
      <div className="space-y-2">
        {addons.map(addon => (
          <button
            key={addon.key}
            onClick={() => !addon.disabled && toggle(addon.key)}
            disabled={addon.disabled}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
              addon.disabled
                ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                : selections[addon.key]
                  ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-200'
                  : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex-shrink-0 w-10 flex items-center justify-center">
              {addon.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">{addon.label}</span>
                {addon.disabled && addon.disabledNote && (
                  <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{addon.disabledNote}</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{addon.description}</p>
            </div>
            <div className="flex-shrink-0 flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">+{formatSEK(addon.price)}</span>
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                selections[addon.key]
                  ? 'bg-blue-500 border-blue-500'
                  : 'border-gray-300 bg-white'
              }`}>
                {selections[addon.key] && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Tillbehör */}
      <h3 className="text-sm font-medium text-gray-700 pt-2">Tillbehör</h3>
      <div className="space-y-2">
        {accessories.map(acc => (
          <button
            key={acc.key}
            onClick={() => toggle(acc.key)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
              selections[acc.key]
                ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-200'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex-shrink-0 w-10 flex items-center justify-center text-xl">
              {acc.icon}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-gray-900">{acc.label}</span>
              <p className="text-xs text-gray-500 mt-0.5">{acc.description}</p>
            </div>
            <div className="flex-shrink-0 flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">+{formatSEK(acc.price)}</span>
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                selections[acc.key]
                  ? 'bg-blue-500 border-blue-500'
                  : 'border-gray-300 bg-white'
              }`}>
                {selections[acc.key] && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
