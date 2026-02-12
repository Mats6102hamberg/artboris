import { SizeOption } from '@/types/design'

export const POSTER_SIZES: SizeOption[] = [
  { id: 'a5', label: 'A5 (15×21 cm)', widthCm: 14.8, heightCm: 21.0, dpi: 300, priceCredits: 5 },
  { id: 'a4', label: 'A4 (21×30 cm)', widthCm: 21.0, heightCm: 29.7, dpi: 300, priceCredits: 8 },
  { id: 'a3', label: 'A3 (30×42 cm)', widthCm: 29.7, heightCm: 42.0, dpi: 300, priceCredits: 12 },
  { id: '30x40', label: '30×40 cm', widthCm: 30.0, heightCm: 40.0, dpi: 300, priceCredits: 12 },
  { id: '40x50', label: '40×50 cm', widthCm: 40.0, heightCm: 50.0, dpi: 300, priceCredits: 15 },
  { id: '50x70', label: '50×70 cm', widthCm: 50.0, heightCm: 70.0, dpi: 300, priceCredits: 20 },
  { id: '61x91', label: '61×91 cm', widthCm: 61.0, heightCm: 91.0, dpi: 300, priceCredits: 25 },
  { id: '70x100', label: '70×100 cm', widthCm: 70.0, heightCm: 100.0, dpi: 300, priceCredits: 30 },
]

export function getSizeById(id: string): SizeOption | undefined {
  return POSTER_SIZES.find(s => s.id === id)
}

export function cmToPixels(cm: number, dpi: number): number {
  return Math.round((cm / 2.54) * dpi)
}

export function getPixelDimensions(size: SizeOption): { width: number; height: number } {
  return {
    width: cmToPixels(size.widthCm, size.dpi),
    height: cmToPixels(size.heightCm, size.dpi),
  }
}

export function getPreviewDimensions(
  size: SizeOption,
  maxWidth: number = 800,
  maxHeight: number = 1200
): { width: number; height: number } {
  const aspect = size.widthCm / size.heightCm
  let width = maxWidth
  let height = width / aspect

  if (height > maxHeight) {
    height = maxHeight
    width = height * aspect
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
  }
}
