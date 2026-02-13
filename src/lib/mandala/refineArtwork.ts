/**
 * Refine artwork — local canvas pixel processing.
 * Applies subtle enhancements: smoothing, contrast, vibrance, depth.
 * Modular and extensible.
 */

export interface RefineSettings {
  smoothingPasses?: number    // 1–3, default 1
  contrastAmount?: number     // 0–1, default 0.08
  vibranceAmount?: number     // 0–1, default 0.08
  depthGlow?: boolean         // radial inner glow, default true
  depthGlowIntensity?: number // 0–1, default 0.06
}

const DEFAULT_SETTINGS: Required<RefineSettings> = {
  smoothingPasses: 1,
  contrastAmount: 0.08,
  vibranceAmount: 0.08,
  depthGlow: true,
  depthGlowIntensity: 0.06,
}

/**
 * Takes raw ImageData, returns a refined clone.
 * Never mutates the original.
 */
export function refineArtwork(
  source: ImageData,
  settings?: RefineSettings
): ImageData {
  const s = { ...DEFAULT_SETTINGS, ...settings }

  // Clone source data
  let data = new Uint8ClampedArray(source.data.buffer.slice(0))
  const w = source.width
  const h = source.height

  // Pass 1: Stroke smoothing (box blur on non-background pixels)
  for (let pass = 0; pass < s.smoothingPasses; pass++) {
    data = applySmoothingPass(data, w, h)
  }

  // Pass 2: Subtle contrast enhancement
  if (s.contrastAmount > 0) {
    applyContrast(data, s.contrastAmount)
  }

  // Pass 3: Vibrance boost
  if (s.vibranceAmount > 0) {
    applyVibrance(data, s.vibranceAmount)
  }

  // Pass 4: Radial depth glow
  if (s.depthGlow) {
    applyRadialGlow(data, w, h, s.depthGlowIntensity)
  }

  return new ImageData(data, w, h)
}

/**
 * Lightweight 3×3 box blur — smooths strokes without destroying structure.
 * Only blurs pixels that have alpha > 0 and differ from pure background.
 */
function applySmoothingPass(
  src: Uint8ClampedArray<ArrayBuffer>,
  w: number,
  h: number
): Uint8ClampedArray<ArrayBuffer> {
  const out = new Uint8ClampedArray(src.buffer.slice(0))

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4
      const a = src[idx + 3]

      // Skip fully transparent pixels
      if (a === 0) continue

      let rSum = 0, gSum = 0, bSum = 0, aSum = 0
      let count = 0

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const ni = ((y + dy) * w + (x + dx)) * 4
          // Weight center pixel more heavily (3×) to preserve detail
          const weight = (dx === 0 && dy === 0) ? 3 : 1
          rSum += src[ni] * weight
          gSum += src[ni + 1] * weight
          bSum += src[ni + 2] * weight
          aSum += src[ni + 3] * weight
          count += weight
        }
      }

      out[idx] = Math.round(rSum / count)
      out[idx + 1] = Math.round(gSum / count)
      out[idx + 2] = Math.round(bSum / count)
      out[idx + 3] = Math.round(aSum / count)
    }
  }

  return out
}

/**
 * Subtle S-curve contrast: pushes darks slightly darker, lights slightly lighter.
 */
function applyContrast(data: Uint8ClampedArray<ArrayBuffer>, amount: number): void {
  const factor = 1 + amount * 2 // e.g. 0.08 → 1.16

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue

    for (let c = 0; c < 3; c++) {
      const val = data[i + c]
      // S-curve around midpoint 128
      const normalized = (val - 128) / 128
      const curved = Math.sign(normalized) * Math.pow(Math.abs(normalized), 1 / factor)
      data[i + c] = Math.max(0, Math.min(255, Math.round(curved * 128 + 128)))
    }
  }
}

/**
 * Vibrance: boosts saturation of less-saturated colors more than already-saturated ones.
 * This avoids over-saturating dominant colors.
 */
function applyVibrance(data: Uint8ClampedArray<ArrayBuffer>, amount: number): void {
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue

    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const sat = max === 0 ? 0 : (max - min) / max

    // Less saturated → more boost
    const boost = amount * (1 - sat) * 2

    const avg = (r + g + b) / 3
    data[i] = clamp(r + (r - avg) * boost)
    data[i + 1] = clamp(g + (g - avg) * boost)
    data[i + 2] = clamp(b + (b - avg) * boost)
  }
}

/**
 * Radial inner glow: subtle darkening at edges, slight brightening at center.
 * Creates depth without altering structure.
 */
function applyRadialGlow(
  data: Uint8ClampedArray<ArrayBuffer>,
  w: number,
  h: number,
  intensity: number
): void {
  const cx = w / 2
  const cy = h / 2
  const maxDist = Math.sqrt(cx * cx + cy * cy)

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4
      if (data[idx + 3] === 0) continue

      const dx = x - cx
      const dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      const normalizedDist = dist / maxDist

      // Vignette: darken edges, brighten center slightly
      // Center (0) → +intensity, Edge (1) → -intensity
      const adjustment = (1 - normalizedDist * 2) * intensity * 255

      for (let c = 0; c < 3; c++) {
        data[idx + c] = clamp(data[idx + c] + adjustment)
      }
    }
  }
}

function clamp(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)))
}
