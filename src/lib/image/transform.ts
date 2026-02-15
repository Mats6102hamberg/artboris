import { WallCorner } from '@/types/design'

export interface PerspectiveTransformResult {
  transformedImageUrl: string
  cssTransform: string
}

/**
 * Calculate CSS perspective transform matrix from 4 wall corners.
 * Used client-side for preview; server-side uses Sharp for final render.
 */
export function calculatePerspectiveCSS(
  corners: WallCorner[],
  posterWidth: number,
  posterHeight: number,
  containerWidth: number,
  containerHeight: number
): string {
  if (corners.length !== 4) {
    return 'none'
  }

  // Corners: [topLeft, topRight, bottomRight, bottomLeft]
  const [tl, tr, br, bl] = corners

  // Scale corners to container dimensions
  const srcPoints = [
    { x: 0, y: 0 },
    { x: posterWidth, y: 0 },
    { x: posterWidth, y: posterHeight },
    { x: 0, y: posterHeight },
  ]

  const dstPoints = [
    { x: tl.x * containerWidth, y: tl.y * containerHeight },
    { x: tr.x * containerWidth, y: tr.y * containerHeight },
    { x: br.x * containerWidth, y: br.y * containerHeight },
    { x: bl.x * containerWidth, y: bl.y * containerHeight },
  ]

  // Compute 3x3 perspective transform matrix
  const matrix = computeTransformMatrix(srcPoints, dstPoints)
  if (!matrix) return 'none'

  // Convert to CSS matrix3d
  return `matrix3d(${matrix[0]},${matrix[3]},0,${matrix[6]},${matrix[1]},${matrix[4]},0,${matrix[7]},0,0,1,0,${matrix[2]},${matrix[5]},0,${matrix[8]})`
}

function computeTransformMatrix(
  src: { x: number; y: number }[],
  dst: { x: number; y: number }[]
): number[] | null {
  if (src.length !== 4 || dst.length !== 4) return null

  // Build 8x8 system of equations for perspective transform
  const A: number[][] = []
  const b: number[] = []

  for (let i = 0; i < 4; i++) {
    const sx = src[i].x
    const sy = src[i].y
    const dx = dst[i].x
    const dy = dst[i].y

    A.push([sx, sy, 1, 0, 0, 0, -dx * sx, -dx * sy])
    b.push(dx)
    A.push([0, 0, 0, sx, sy, 1, -dy * sx, -dy * sy])
    b.push(dy)
  }

  const h = solveLinearSystem(A, b)
  if (!h) return null

  return [...h, 1]
}

function solveLinearSystem(A: number[][], b: number[]): number[] | null {
  const n = b.length
  const augmented = A.map((row, i) => [...row, b[i]])

  // Gaussian elimination with partial pivoting
  for (let col = 0; col < n; col++) {
    let maxRow = col
    let maxVal = Math.abs(augmented[col][col])
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(augmented[row][col]) > maxVal) {
        maxVal = Math.abs(augmented[row][col])
        maxRow = row
      }
    }

    if (maxVal < 1e-10) return null

    ;[augmented[col], augmented[maxRow]] = [augmented[maxRow], augmented[col]]

    for (let row = col + 1; row < n; row++) {
      const factor = augmented[row][col] / augmented[col][col]
      for (let j = col; j <= n; j++) {
        augmented[row][j] -= factor * augmented[col][j]
      }
    }
  }

  // Back substitution
  const x = new Array(n).fill(0)
  for (let i = n - 1; i >= 0; i--) {
    x[i] = augmented[i][n]
    for (let j = i + 1; j < n; j++) {
      x[i] -= augmented[i][j] * x[j]
    }
    x[i] /= augmented[i][i]
  }

  return x
}

/**
 * Assumed visible wall width in cm for realistic poster sizing.
 * The visible wall area in a typical room photo is ~200 cm wide.
 */
const ASSUMED_WALL_WIDTH_CM = 200

/**
 * Calculate poster position and size within wall area.
 * Uses real cm dimensions for realistic proportions.
 * scale=1.0 shows the true selected size on the wall.
 */
export function calculatePosterPlacement(
  wallCorners: WallCorner[],
  positionX: number,
  positionY: number,
  scale: number,
  posterAspectRatio: number,
  posterWidthCm?: number,
  posterHeightCm?: number,
): { left: number; top: number; width: number; height: number } {
  if (wallCorners.length !== 4) {
    return { left: 0.25, top: 0.25, width: 0.5, height: 0.5 }
  }

  const [tl, tr, , bl] = wallCorners
  const wallWidth = Math.abs(tr.x - tl.x)
  const wallHeight = Math.abs(bl.y - tl.y)

  let baseWidth: number
  let baseHeight: number

  if (posterWidthCm && posterHeightCm) {
    // Realistic sizing: poster cm relative to assumed visible wall width
    baseWidth = (posterWidthCm / ASSUMED_WALL_WIDTH_CM) * wallWidth * scale
    baseHeight = (posterHeightCm / ASSUMED_WALL_WIDTH_CM) * wallWidth * scale

    // Ensure poster is never invisibly small (min 10% of wall width)
    const minWidth = wallWidth * 0.10
    if (baseWidth < minWidth && scale >= 0.5) {
      const boost = minWidth / baseWidth
      baseWidth *= boost
      baseHeight *= boost
    }
  } else {
    // Fallback: use aspect ratio with a default proportion
    baseWidth = wallWidth * 0.35 * scale
    baseHeight = baseWidth / posterAspectRatio
  }

  const width = baseWidth
  const height = baseHeight

  // Position uses wall center as anchor — positionX/Y 0.5 = centered on wall
  // Movement range = full wall width/height, allowing free placement
  const left = tl.x + wallWidth * positionX - width / 2
  const top = tl.y + wallHeight * positionY - height / 2

  return { left, top, width, height }
}
