import { NextRequest, NextResponse } from 'next/server'
import { generatePreview } from '@/server/services/ai/generatePreview'
import { StylePreset, DesignControls } from '@/types/design'
import { getStyleDefinition } from '@/lib/prompts/styles'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { style, controls, userDescription } = body as {
      style: StylePreset
      controls: DesignControls
      userDescription?: string
    }

    if (!style) {
      return NextResponse.json({ error: 'Stil krävs.' }, { status: 400 })
    }

    const styleDef = getStyleDefinition(style)
    if (!styleDef) {
      return NextResponse.json({ error: 'Okänd stil.' }, { status: 400 })
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
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Generering misslyckades.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      designId: `design_${Date.now()}`,
      variants: result.variants,
      prompt: result.prompt,
      style,
      controls: defaultControls,
    })
  } catch (error) {
    console.error('[designs/generate] Error:', error)
    return NextResponse.json(
      { error: 'Generering misslyckades.' },
      { status: 500 }
    )
  }
}
