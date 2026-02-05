import { NextRequest, NextResponse } from 'next/server'

// Mock-database för dina tavlor (i production skulle detta vara en riktig databas)
let myArtworks: any[] = [
  {
    id: '1',
    title: 'Solnedgång över havet',
    artist: 'Mats Hamberg',
    description: 'Oljemålning på duk, 60x80cm. En vacker solnedgång med varma färger.',
    price: 15000,
    imageUrl: 'https://picsum.photos/seed/solnedgang/400/300',
    category: 'målning',
    year: 2024,
    status: 'tillgänglig',
    bids: [],
    views: 0
  },
  {
    id: '2', 
    title: 'Abstrakt komposition',
    artist: 'Mats Hamberg',
    description: 'Akrylmålning på canvas, 50x70cm. Modern abstrakt konst.',
    price: 12000,
    imageUrl: 'https://picsum.photos/seed/abstrakt/400/300',
    category: 'målning',
    year: 2024,
    status: 'tillgänglig',
    bids: [],
    views: 0
  }
]

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      artworks: myArtworks,
      total: myArtworks.length
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch artworks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const artwork = await request.json()
    
    const newArtwork = {
      id: Date.now().toString(),
      ...artwork,
      status: 'tillgänglig',
      bids: [],
      views: 0,
      createdAt: new Date().toISOString()
    }
    
    myArtworks.push(newArtwork)
    
    return NextResponse.json({
      success: true,
      artwork: newArtwork
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create artwork' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json()
    
    const index = myArtworks.findIndex(art => art.id === id)
    if (index === -1) {
      return NextResponse.json(
        { error: 'Artwork not found' },
        { status: 404 }
      )
    }
    
    myArtworks[index] = { ...myArtworks[index], ...updates }
    
    return NextResponse.json({
      success: true,
      artwork: myArtworks[index]
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update artwork' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()
    
    const index = myArtworks.findIndex(art => art.id === id)
    if (index === -1) {
      return NextResponse.json(
        { error: 'Artwork not found' },
        { status: 404 }
      )
    }
    
    myArtworks.splice(index, 1)
    
    return NextResponse.json({
      success: true,
      message: 'Artwork deleted successfully'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete artwork' },
      { status: 500 }
    )
  }
}
