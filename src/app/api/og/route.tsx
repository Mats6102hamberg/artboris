import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const title = searchParams.get('title') || 'Artboris'
  const subtitle = searchParams.get('subtitle') || 'Din kreativa plattform för väggkonst'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '60px',
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              marginBottom: 16,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 32,
              color: '#a0aec0',
              textAlign: 'center',
              maxWidth: 800,
            }}
          >
            {subtitle}
          </div>
          <div
            style={{
              marginTop: 48,
              fontSize: 24,
              color: '#718096',
              borderTop: '1px solid #2d3748',
              paddingTop: 24,
            }}
          >
            artboris.se
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  )
}
