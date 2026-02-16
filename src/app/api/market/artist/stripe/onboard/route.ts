import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover',
  })
}

/**
 * POST /api/market/artist/stripe/onboard
 * Creates a Stripe Connect Express account for the artist and returns an onboarding link.
 * Requires x-artist-token header.
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('x-artist-token')
    if (!token) {
      return NextResponse.json({ error: 'Autentisering krävs.' }, { status: 401 })
    }

    const artist = await prisma.artistProfile.findUnique({
      where: { accessToken: token },
      select: {
        id: true,
        email: true,
        displayName: true,
        stripeAccountId: true,
        stripeOnboardingDone: true,
      },
    })

    if (!artist) {
      return NextResponse.json({ error: 'Konstnär hittades inte.' }, { status: 404 })
    }

    const stripe = getStripe()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    let stripeAccountId = artist.stripeAccountId

    // Create Connect account if not exists
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'SE',
        email: artist.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: {
          artistId: artist.id,
        },
      })

      stripeAccountId = account.id

      await prisma.artistProfile.update({
        where: { id: artist.id },
        data: { stripeAccountId: account.id },
      })
    }

    // Create onboarding link (or login link if already onboarded)
    if (artist.stripeOnboardingDone) {
      // Already onboarded — return Stripe dashboard link
      const loginLink = await stripe.accounts.createLoginLink(stripeAccountId)
      return NextResponse.json({
        url: loginLink.url,
        type: 'dashboard',
        message: 'Du är redan kopplad till Stripe.',
      })
    }

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${appUrl}/market/artist?tab=dashboard&stripe=refresh`,
      return_url: `${appUrl}/market/artist?tab=dashboard&stripe=complete`,
      type: 'account_onboarding',
    })

    return NextResponse.json({
      url: accountLink.url,
      type: 'onboarding',
    })
  } catch (error) {
    console.error('[stripe/onboard] Error:', error)
    return NextResponse.json(
      { error: 'Kunde inte starta Stripe-koppling.' },
      { status: 500 }
    )
  }
}
