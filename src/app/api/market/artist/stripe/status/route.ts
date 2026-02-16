import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover',
  })
}

/**
 * GET /api/market/artist/stripe/status
 * Returns the Stripe Connect onboarding status for the artist.
 * Also syncs the status from Stripe if account exists.
 * Requires x-artist-token header.
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('x-artist-token')
    if (!token) {
      return NextResponse.json({ error: 'Autentisering krävs.' }, { status: 401 })
    }

    const artist = await prisma.artistProfile.findUnique({
      where: { accessToken: token },
      select: {
        id: true,
        stripeAccountId: true,
        stripeOnboardingDone: true,
        stripePayoutsEnabled: true,
      },
    })

    if (!artist) {
      return NextResponse.json({ error: 'Konstnär hittades inte.' }, { status: 404 })
    }

    // No Stripe account yet
    if (!artist.stripeAccountId) {
      return NextResponse.json({
        connected: false,
        onboardingDone: false,
        payoutsEnabled: false,
        message: 'Stripe-konto ej kopplat. Starta onboarding.',
      })
    }

    // Sync status from Stripe
    const stripe = getStripe()
    const account = await stripe.accounts.retrieve(artist.stripeAccountId)

    const chargesEnabled = account.charges_enabled ?? false
    const payoutsEnabled = account.payouts_enabled ?? false

    // Update DB if status changed
    if (
      chargesEnabled !== artist.stripeOnboardingDone ||
      payoutsEnabled !== artist.stripePayoutsEnabled
    ) {
      await prisma.artistProfile.update({
        where: { id: artist.id },
        data: {
          stripeOnboardingDone: chargesEnabled,
          stripePayoutsEnabled: payoutsEnabled,
        },
      })
    }

    return NextResponse.json({
      connected: true,
      onboardingDone: chargesEnabled,
      payoutsEnabled: payoutsEnabled,
      stripeAccountId: artist.stripeAccountId,
      message: chargesEnabled
        ? 'Stripe-konto aktivt. Utbetalningar sker automatiskt.'
        : 'Stripe-konto skapat men onboarding ej klar. Slutför registreringen.',
    })
  } catch (error) {
    console.error('[stripe/status] Error:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta Stripe-status.' },
      { status: 500 }
    )
  }
}
