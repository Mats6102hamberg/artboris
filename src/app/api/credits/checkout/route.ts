import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getUserId } from '@/lib/auth/getUserId'
import { CREDIT_PACKAGES } from '@/lib/pricing/credits'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover',
  })
}

export async function POST(req: NextRequest) {
  try {
    const anonId = await getUserId()
    const body = await req.json()
    const { packageId } = body as { packageId: string }

    const pkg = CREDIT_PACKAGES.find(p => p.id === packageId)
    if (!pkg) {
      return NextResponse.json(
        { error: 'Ogiltigt paket.' },
        { status: 400 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      currency: 'sek',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'sek',
            unit_amount: pkg.priceSEK * 100, // Stripe uses öre
            product_data: {
              name: `Artboris Credits — ${pkg.label}`,
              description: `${pkg.credits} credits`,
            },
          },
        },
      ],
      success_url: `${appUrl}/credits/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/credits/cancel`,
      metadata: {
        type: 'credits_purchase',
        userId: anonId,
        packageId: pkg.id,
        credits: String(pkg.credits),
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[credits/checkout] Error:', err)
    return NextResponse.json(
      { error: 'Kunde inte skapa checkout-session.' },
      { status: 500 }
    )
  }
}
