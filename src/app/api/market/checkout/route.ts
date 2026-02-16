import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { getOrCreateAnonId } from '@/lib/anonId'
import { calculateMarketPrice } from '@/lib/pricing/market'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover',
  })
}

export async function POST(req: Request) {
  try {
    const anonId = await getOrCreateAnonId()
    const body = await req.json()

    const {
      listingId,
      sizeCode,
      frameColor,
      shipping,
    } = body as {
      listingId: string
      sizeCode: string
      frameColor: string
      shipping: {
        firstName: string
        lastName: string
        email: string
        phone?: string
        address: string
        postalCode: string
        city: string
      }
    }

    if (!listingId || !sizeCode) {
      return NextResponse.json(
        { error: 'listingId och sizeCode krävs.' },
        { status: 400 }
      )
    }

    if (!shipping?.firstName || !shipping?.lastName || !shipping?.email || !shipping?.address || !shipping?.postalCode || !shipping?.city) {
      return NextResponse.json(
        { error: 'Leveransuppgifter krävs.' },
        { status: 400 }
      )
    }

    // Fetch listing + artist Stripe info
    const listing = await prisma.artworkListing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        title: true,
        artistId: true,
        artistPriceSEK: true,
        isOriginal: true,
        isSold: true,
        isPublic: true,
        imageUrl: true,
        artist: {
          select: {
            stripeAccountId: true,
            stripeOnboardingDone: true,
          },
        },
      },
    })

    if (!listing) {
      return NextResponse.json({ error: 'Konstverk hittades inte.' }, { status: 404 })
    }

    if (!listing.isPublic) {
      return NextResponse.json({ error: 'Konstverket är inte tillgängligt.' }, { status: 400 })
    }

    if (listing.isOriginal && listing.isSold) {
      return NextResponse.json({ error: 'Originalet är redan sålt.' }, { status: 400 })
    }

    // Calculate pricing
    const pricing = calculateMarketPrice(listing.artistPriceSEK, sizeCode, frameColor || 'none')
    const totalCents = pricing.totalBuyerSEK * 100

    // Create MarketOrder
    const marketOrder = await prisma.marketOrder.create({
      data: {
        listingId: listing.id,
        artistId: listing.artistId,
        buyerAnonId: anonId,
        sizeCode,
        frameColor: (frameColor && frameColor !== 'none' ? frameColor.toUpperCase() : 'NONE') as any,
        artistShareCents: pricing.artistShareSEK * 100,
        platformShareCents: pricing.platformShareSEK * 100,
        frameCostCents: pricing.printCostSEK * 100,
        shippingCents: pricing.shippingSEK * 100,
        totalCents,
        status: 'PENDING',
        buyerName: `${shipping.firstName} ${shipping.lastName}`,
        buyerEmail: shipping.email,
        buyerAddress: shipping.address,
        buyerPostalCode: shipping.postalCode,
        buyerCity: shipping.city,
        buyerCountry: 'SE',
      },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Build Stripe line items
    const stripeLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        quantity: 1,
        price_data: {
          currency: 'sek',
          unit_amount: listing.artistPriceSEK * 100,
          product_data: {
            name: listing.title,
            description: `Konstverk av konstnären`,
          },
        },
      },
      {
        quantity: 1,
        price_data: {
          currency: 'sek',
          unit_amount: pricing.printCostSEK * 100,
          product_data: {
            name: `Tryck + ram (${sizeCode})`,
            description: frameColor && frameColor !== 'none' ? `Ram: ${frameColor}` : 'Utan ram',
          },
        },
      },
      {
        quantity: 1,
        price_data: {
          currency: 'sek',
          unit_amount: pricing.shippingSEK * 100,
          product_data: {
            name: 'Frakt',
            description: 'Leverans inom Sverige',
          },
        },
      },
    ]

    const stripe = getStripe()

    // Build session params
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      currency: 'sek',
      line_items: stripeLineItems,
      success_url: `${appUrl}/market/order/success?marketOrderId=${marketOrder.id}`,
      cancel_url: `${appUrl}/market/${listingId}`,
      customer_email: shipping.email,
      metadata: {
        marketOrderId: marketOrder.id,
        listingId: listing.id,
      },
    }

    // If artist has Stripe Connect — automatically transfer their share
    if (listing.artist.stripeAccountId && listing.artist.stripeOnboardingDone) {
      const artistTransferCents = pricing.artistShareSEK * 100
      sessionParams.payment_intent_data = {
        transfer_data: {
          destination: listing.artist.stripeAccountId,
          amount: artistTransferCents,
        },
      }
      console.log(`[market/checkout] Stripe Connect transfer: ${artistTransferCents} öre → ${listing.artist.stripeAccountId}`)
    } else {
      console.log(`[market/checkout] Artist ${listing.artistId} has no Stripe Connect — payout must be manual`)
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    // Save Stripe session reference
    await prisma.marketOrder.update({
      where: { id: marketOrder.id },
      data: { stripePaymentIntentId: session.id },
    })

    return NextResponse.json({ url: session.url, marketOrderId: marketOrder.id })
  } catch (err: any) {
    console.error('[market/checkout] Error:', err)
    const message = err?.message || 'Okänt fel'
    return NextResponse.json(
      { error: `Kunde inte skapa checkout-session: ${message}` },
      { status: 500 }
    )
  }
}
