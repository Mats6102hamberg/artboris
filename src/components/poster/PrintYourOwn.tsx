'use client'

import { useState, useRef, useCallback } from 'react'
import { analyzePrintQuality, getQualityLabel, type DpiResult } from '@/lib/image/dpiAnalysis'

interface PrintYourOwnProps {
  onImageReady: (imageUrl: string, imageWidth: number, imageHeight: number) => void
}

export default function PrintYourOwn({ onImageReady }: PrintYourOwnProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<DpiResult[] | null>(null)
  const [imageSize, setImageSize] = useState<{ w: number; h: number } | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [enhanceResult, setEnhanceResult] = useState<{ wasUpscaled: boolean; upscaleFactor: number; originalWidth: number; originalHeight: number; enhancedWidth: number; enhancedHeight: number } | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    if (file.size > 25 * 1024 * 1024) {
      alert('Image too large (max 25 MB)')
      return
    }

    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    setPreview(url)

    // Analyze image dimensions
    const img = new Image()
    img.onload = () => {
      const w = img.naturalWidth
      const h = img.naturalHeight
      setImageSize({ w, h })
      setAnalysis(analyzePrintQuality(w, h))
    }
    img.src = url
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [processFile])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }, [processFile])

  const handleUploadAndContinue = async () => {
    if (!preview || !selectedFile || !imageSize) return
    setIsUploading(true)
    setUploadError(null)
    setEnhanceResult(null)

    const needsUpscale = Math.max(imageSize.w, imageSize.h) < 3000
    setUploadStatus(needsUpscale ? 'AI-uppskalerar bilden...' : 'Optimerar för tryck...')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const res = await fetch('/api/uploads/enhance', { method: 'POST', body: formData })
      const data = await res.json()

      if (data.success && data.imageUrl) {
        setEnhanceResult({
          wasUpscaled: data.wasUpscaled,
          upscaleFactor: data.upscaleFactor,
          originalWidth: data.originalWidth,
          originalHeight: data.originalHeight,
          enhancedWidth: data.enhancedWidth,
          enhancedHeight: data.enhancedHeight,
        })
        // Re-analyze with enhanced dimensions
        setImageSize({ w: data.enhancedWidth, h: data.enhancedHeight })
        setAnalysis(analyzePrintQuality(data.enhancedWidth, data.enhancedHeight))
        setUploadStatus(null)
        onImageReady(data.imageUrl, data.enhancedWidth, data.enhancedHeight)
      } else {
        throw new Error(data.error || 'Enhancement failed')
      }
    } catch (err) {
      console.error('Enhance error:', err)
      setUploadError('Bildförbättring misslyckades. Försöker med originalbilden...')
      // Fallback: upload original
      try {
        const formData = new FormData()
        formData.append('file', selectedFile)
        const res = await fetch('/api/uploads/artwork', { method: 'POST', body: formData })
        const data = await res.json()
        if (data.success && data.imageUrl) {
          onImageReady(data.imageUrl, imageSize.w, imageSize.h)
        } else {
          onImageReady(preview, imageSize.w, imageSize.h)
        }
      } catch {
        onImageReady(preview, imageSize.w, imageSize.h)
      }
    } finally {
      setIsUploading(false)
      setUploadStatus(null)
    }
  }

  const qualityColor = (q: DpiResult['quality']) => {
    switch (q) {
      case 'perfect': return 'text-green-600 bg-green-50 border-green-200'
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'fair': return 'text-amber-600 bg-amber-50 border-amber-200'
      case 'low': return 'text-red-500 bg-red-50 border-red-200'
    }
  }

  const qualityIcon = (q: DpiResult['quality']) => {
    switch (q) {
      case 'perfect': return '✓'
      case 'good': return '○'
      case 'fair': return '⚠'
      case 'low': return '✕'
    }
  }

  return (
    <div className="space-y-5">
      {/* Upload area */}
      {!preview ? (
        <div
          className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-gray-900 bg-gray-50'
              : 'border-gray-300 hover:border-gray-400 bg-white'
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Drop your photo here</p>
              <p className="text-xs text-gray-500 mt-1">or click to browse · JPG, PNG, WebP · max 25 MB</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Preview */}
          <div className="relative rounded-2xl overflow-hidden bg-gray-100 border border-gray-200">
            <img
              src={preview}
              alt="Your photo"
              className="w-full max-h-[300px] object-contain"
            />
            <button
              onClick={() => { setPreview(null); setAnalysis(null); setImageSize(null); setSelectedFile(null) }}
              className="absolute top-3 right-3 w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {imageSize && (
              <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm text-white text-[11px] font-medium px-2.5 py-1 rounded-full">
                {imageSize.w} × {imageSize.h} px
              </div>
            )}
          </div>

          {/* DPI Analysis */}
          {analysis && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Print Quality Analysis</h4>
              <div className="space-y-2">
                {analysis.map((r) => (
                  <div
                    key={r.sizeId}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs ${qualityColor(r.quality)}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{qualityIcon(r.quality)}</span>
                      <span className="font-medium">{r.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="opacity-70">{r.actualDpi} DPI</span>
                      <span className="font-medium">{getQualityLabel(r.quality)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error message */}
          {uploadError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-700">{uploadError}</p>
            </div>
          )}

          {/* Enhancement result */}
          {enhanceResult && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3">
              <div className="flex items-start gap-2">
                <span className="text-green-600 text-sm">✓</span>
                <div className="text-xs text-green-800">
                  <p className="font-medium">Bilden har optimerats för tryck</p>
                  {enhanceResult.wasUpscaled && (
                    <p className="mt-0.5 text-green-700">
                      AI-uppskalerad {enhanceResult.upscaleFactor}× ({enhanceResult.originalWidth}×{enhanceResult.originalHeight} → {enhanceResult.enhancedWidth}×{enhanceResult.enhancedHeight} px)
                    </p>
                  )}
                  <p className="mt-0.5 text-green-700">Skärpa, färg och kontrast förbättrade</p>
                </div>
              </div>
            </div>
          )}

          {/* Continue button */}
          <button
            onClick={handleUploadAndContinue}
            disabled={isUploading}
            className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-medium text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {uploadStatus || 'Bearbetar...'}
              </>
            ) : (
              <>
                Optimera &amp; använd bilden
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
