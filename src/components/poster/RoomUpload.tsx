'use client'

import { useState, useRef, useCallback } from 'react'

interface RoomUploadProps {
  onUpload: (imageUrl: string, file: File) => void
  isUploading?: boolean
}

export default function RoomUpload({ onUpload, isUploading = false }: RoomUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Vänligen välj en bildfil.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Bilden är för stor (max 10 MB).')
      return
    }

    const url = URL.createObjectURL(file)
    setPreview(url)
    onUpload(url, file)
  }, [onUpload])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="w-full">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200
          ${dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
          }
          ${preview ? 'p-2' : 'p-12'}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
        />

        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Rumsfoto"
              className="w-full rounded-xl object-cover max-h-[500px]"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white" />
              </div>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setPreview(null)
              }}
              className="absolute top-3 right-3 bg-white/90 hover:bg-white rounded-full p-2 shadow-md transition-colors"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <p className="mt-4 text-lg font-medium text-gray-700">
              Ladda upp ett foto av ditt rum
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Dra och släpp eller klicka för att välja. JPG, PNG, WebP (max 10 MB)
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
