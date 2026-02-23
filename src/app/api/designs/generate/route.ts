import { NextRequest, NextResponse } from 'next/server'
import { generatePreview } from '@/server/services/ai/generatePreview'
import { StylePreset, DesignControls } from '@/types/design'
import { getStyleDefinition } from '@/lib/prompts/styles'
import { getUserId } from '@/lib/auth/getUserId'
import { getUsage, incrementGeneration } from '@/server/services/usage/dailyUsage'
import { borisLogIncident } from '@/lib/boris/autoIncident'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const anonId = await getUserId()

    // Check daily quota
    const usage = await getUsage(anonId)
    if (!usage.canGenerate) {
      return NextResponse.json(
        {
          error: `You have used all ${usage.generationsLimit} free generations today. Come back tomorrow!`,
          quotaExceeded: true,
          remaining: 0,
          limit: usage.generationsLimit,
        },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { style, controls, userDescription, roomImageUrl, wallCorners, inputImageUrl, promptStrength, aspectRatio } = body as {
      style: StylePreset
      controls: DesignControls
      userDescription?: string
      roomImageUrl?: string
      wallCorners?: string
      inputImageUrl?: string
      promptStrength?: number
      aspectRatio?: 'portrait' | 'landscape' | 'square'
    }

    if (!style) {
      return NextResponse.json({ error: 'Style is required.' }, { status: 400 })
    }

    const styleDef = getStyleDefinition(style)
    if (!styleDef) {
      return NextResponse.json({ error: 'Unknown style.' }, { status: 400 })
    }

    const defaultControls: DesignControls = Object.assign(
      {
        colorPalette: styleDef.defaultColors,
        mood: styleDef.defaultMood,
        contrast: 50,
        brightness: 50,
        saturation: 50,
        textOverlay: '',
        textFont: 'sans-serif',
        textPosition: 'none' as const,
      },
      controls || {}
    )

    const result = await generatePreview({
      style,
      controls: defaultControls,
      userDescription,
      count: 4,
      anonId,
      roomImageUrl,
      wallCorners,
      inputImageUrl,
      promptStrength,
      aspectRatio,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Generering misslyckades.' },
        { status: 500 }
      )
    }

    // Increment usage after successful generation
    const { remaining } = await incrementGeneration(anonId)

    return NextResponse.json({
      success: true,
      designId: result.designId || `design_${Date.now()}`,
      variants: result.variants,
      prompt: result.prompt,
      style,
      controls: defaultControls,
      generationsRemaining: remaining,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[designs/generate] Error:', msg, error)
    borisLogIncident({
      title: 'AI generation failed',
      description: `Generate endpoint threw: ${msg}`,
      tags: ['generate', 'ai', 'error'],
      data: { error: msg },
    })
    return NextResponse.json(
      { error: `Generering misslyckades: ${msg}` },
      { status: 500 }
    )
  }
}
