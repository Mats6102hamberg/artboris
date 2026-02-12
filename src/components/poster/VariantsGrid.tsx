'use client'

interface Variant {
  id: string
  imageUrl: string
  thumbnailUrl: string
  isSelected: boolean
}

interface VariantsGridProps {
  variants: Variant[]
  selectedIndex: number | null
  onSelect: (index: number) => void
  isLoading?: boolean
}

export default function VariantsGrid({
  variants,
  selectedIndex,
  onSelect,
  isLoading = false,
}: VariantsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="aspect-[2/3] rounded-xl bg-gray-100 animate-pulse flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
              <p className="text-xs text-gray-400 mt-3">Genererar variant {i + 1}...</p>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (variants.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-xl">
        <p className="text-gray-500">Inga varianter genererade ännu.</p>
        <p className="text-sm text-gray-400 mt-1">Välj stil och klicka Generera.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {variants.map((variant, index) => (
        <button
          key={variant.id}
          onClick={() => onSelect(index)}
          className={`
            group relative aspect-[2/3] rounded-xl overflow-hidden border-2 transition-all duration-200
            ${selectedIndex === index
              ? 'border-blue-500 ring-2 ring-blue-200 shadow-lg scale-[1.01]'
              : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            }
          `}
        >
          <img
            src={variant.thumbnailUrl || variant.imageUrl}
            alt={`Variant ${index + 1}`}
            className="w-full h-full object-cover"
          />

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

          {/* Selection indicator */}
          {selectedIndex === index && (
            <div className="absolute top-2 right-2 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}

          {/* Variant number */}
          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
            {index + 1}
          </div>
        </button>
      ))}
    </div>
  )
}
