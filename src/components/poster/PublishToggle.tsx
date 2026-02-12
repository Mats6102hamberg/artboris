'use client'

interface PublishToggleProps {
  isPublished: boolean
  onToggle: (publish: boolean) => void
  disabled?: boolean
}

export default function PublishToggle({ isPublished, onToggle, disabled = false }: PublishToggleProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onToggle(!isPublished)}
        disabled={disabled}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors
          ${isPublished ? 'bg-green-500' : 'bg-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm
            ${isPublished ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
      <span className="text-sm text-gray-700">
        {isPublished ? 'Publicerad i galleriet' : 'Dela i galleriet'}
      </span>
    </div>
  )
}
