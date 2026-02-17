'use client'

import Link from 'next/link'

const TOOLS = [
  { id: 'mandala', label: 'Mandala Maker', desc: 'Symmetrisk konst', path: '/wallcraft/mandala', icon: '◎' },
  { id: 'abstract', label: 'Abstract Painter', desc: 'Generativ målning', path: '/wallcraft/abstract', icon: '◈' },
  { id: 'pattern', label: 'Pattern Studio', desc: 'Mönster & texturer', path: '/wallcraft/pattern', icon: '▦' },
  { id: 'colorfield', label: 'Color Field Studio', desc: 'Färgfält & komposition', path: '/wallcraft/colorfield', icon: '▬' },
] as const

interface CreativeToolsSectionProps {
  imageUrl: string
}

export default function CreativeToolsSection({ imageUrl }: CreativeToolsSectionProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Skapa med detta motiv</h3>
      <div className="grid grid-cols-2 gap-2.5">
        {TOOLS.map(tool => (
          <Link
            key={tool.id}
            href={`${tool.path}?sourceImage=${encodeURIComponent(imageUrl)}`}
            className="group flex flex-col items-center gap-1.5 rounded-xl border border-gray-200/60 bg-white p-3.5 text-center transition-all hover:border-gray-300 hover:shadow-sm"
          >
            <span className="text-2xl opacity-50 group-hover:opacity-80 transition-opacity">{tool.icon}</span>
            <span className="text-xs font-medium text-gray-800 group-hover:text-gray-900">{tool.label}</span>
            <span className="text-[10px] leading-tight text-gray-400">{tool.desc}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
