'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'

interface UseSourceImageOptions {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  canvasSize: number
  /** Set to true once the canvas has been initialized (fillRect done) */
  canvasReady: boolean
  /** Called after the source image is drawn on canvas (e.g. to save history) */
  onLoaded?: () => void
}

/**
 * Reads ?sourceImage=URL from query params and draws it onto the canvas.
 * Waits for canvasReady=true before drawing to avoid race conditions with canvas init.
 * Also reads ?remixDesignId for back-navigation.
 */
export function useSourceImage({ canvasRef, canvasSize, canvasReady, onLoaded }: UseSourceImageOptions) {
  const searchParams = useSearchParams()
  const sourceImage = searchParams.get('sourceImage')
  const remixDesignId = searchParams.get('remixDesignId')
  const remixFrom = searchParams.get('remixFrom')
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(!!sourceImage)
  const hasLoadedRef = useRef(false)
  const onLoadedRef = useRef(onLoaded)
  onLoadedRef.current = onLoaded

  useEffect(() => {
    if (!sourceImage || hasLoadedRef.current || !canvasReady) return
    const canvas = canvasRef.current
    if (!canvas || canvas.width === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      // Draw source image scaled to fit canvas (cover)
      const scale = Math.max(canvas.width / img.width, canvas.height / img.height)
      const w = img.width * scale
      const h = img.height * scale
      const x = (canvas.width - w) / 2
      const y = (canvas.height - h) / 2

      ctx.drawImage(img, x, y, w, h)

      hasLoadedRef.current = true
      setLoaded(true)
      setLoading(false)
      onLoadedRef.current?.()
    }

    img.onerror = () => {
      console.error('[useSourceImage] Failed to load source image:', sourceImage)
      setLoading(false)
    }

    img.src = sourceImage
  }, [sourceImage, canvasRef, canvasSize, canvasReady])

  return { sourceImage, remixDesignId, remixFrom, loaded, loading }
}
