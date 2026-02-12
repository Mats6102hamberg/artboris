import { NextRequest, NextResponse } from 'next/server'
import { refinePreview } from '@/server/services/ai/refinePreview'
import { DesignControls } from '@/types/design'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { originalPrompt, feedback, controls } = body as {
      originalPrompt: string
      feedback: string
      controls: DesignControls
    }

    if (!originalPrompt) {
      return NextResponse.json({ error: 'Originalpromt krävs.' }, { status: 400 })
    }

    const result = await refinePreview({
      originalPrompt,
      feedback: feedback || '',
      controls,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Förfining misslyckades.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      variant: result.variant,
      prompt: result.prompt,
    })
  } catch (error) {
    console.error('[designs/refine] Error:', error)
    return NextResponse.json(
      { error: 'Förfining misslyckades.' },
      { status: 500 }
    )
  }
}
