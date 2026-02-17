import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'
import OrderConfirmation from '@/emails/OrderConfirmation'
import ShippedNotification from '@/emails/ShippedNotification'
import DeliveredNotification from '@/emails/DeliveredNotification'
import ArtistSaleNotification from '@/emails/ArtistSaleNotification'
import CrimsonOrderNotification from '@/emails/CrimsonOrderNotification'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

function getFromEmail() {
  return process.env.EMAIL_FROM || 'Artboris <order@artboris.se>'
}

// ── Order Confirmation (PAID) ──

export async function sendOrderConfirmation(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      shippingAddress: true,
      items: {
        include: {
          design: { select: { title: true, imageUrl: true } },
        },
      },
    },
  })

  if (!order || !order.shippingAddress) {
    console.error(`[email] sendOrderConfirmation: Order ${orderId} or shipping address not found`)
    return
  }

  const to = order.shippingAddress.confirmationEmail || order.shippingAddress.email
  const customerName = order.shippingAddress.fullName

  try {
    const { data, error } = await getResend().emails.send({
      from: getFromEmail(),
      to,
      subject: `Order Confirmation — Artboris #${orderId.slice(0, 8)}`,
      react: OrderConfirmation({
        customerName,
        orderId,
        items: order.items.map(item => ({
          title: item.design.title,
          imageUrl: item.design.imageUrl,
          sizeCode: item.sizeCode,
          productType: item.productType,
          frameColor: item.frameColor,
          quantity: item.quantity,
          lineTotalCents: item.lineTotalCents,
        })),
        subtotalCents: order.subtotalCents,
        shippingCents: order.shippingCents,
        totalCents: order.totalCents,
        currency: order.currency,
        shippingAddress: {
          address1: order.shippingAddress.address1,
          address2: order.shippingAddress.address2,
          postalCode: order.shippingAddress.postalCode,
          city: order.shippingAddress.city,
          countryCode: order.shippingAddress.countryCode,
        },
      }),
    })

    if (error) {
      console.error(`[email] sendOrderConfirmation failed:`, error)
    } else {
      console.log(`[email] Order confirmation sent to ${to} (id: ${data?.id})`)
    }
  } catch (err) {
    console.error(`[email] sendOrderConfirmation error:`, err)
  }
}

// ── Order Confirmation to specific email (from success page) ──

export async function sendOrderConfirmationTo(orderId: string, toEmail: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      shippingAddress: true,
      items: {
        include: {
          design: { select: { title: true, imageUrl: true } },
        },
      },
    },
  })

  if (!order || !order.shippingAddress) {
    throw new Error(`Order ${orderId} or shipping address not found`)
  }

  const customerName = order.shippingAddress.fullName

  const { data, error } = await getResend().emails.send({
    from: getFromEmail(),
    to: toEmail,
    subject: `Order Confirmation — Artboris #${orderId.slice(0, 8)}`,
    react: OrderConfirmation({
      customerName,
      orderId,
      items: order.items.map(item => ({
        title: item.design.title,
        imageUrl: item.design.imageUrl,
        sizeCode: item.sizeCode,
        productType: item.productType,
        frameColor: item.frameColor,
        quantity: item.quantity,
        lineTotalCents: item.lineTotalCents,
      })),
      subtotalCents: order.subtotalCents,
      shippingCents: order.shippingCents,
      totalCents: order.totalCents,
      currency: order.currency,
      shippingAddress: {
        address1: order.shippingAddress.address1,
        address2: order.shippingAddress.address2,
        postalCode: order.shippingAddress.postalCode,
        city: order.shippingAddress.city,
        countryCode: order.shippingAddress.countryCode,
      },
    }),
  })

  if (error) {
    throw new Error(`Email send failed: ${JSON.stringify(error)}`)
  }

  console.log(`[email] Order confirmation sent to ${toEmail} (id: ${data?.id})`)
}

// ── Shipped Notification ──

export async function sendShippedEmail(
  orderId: string,
  fulfillmentData: {
    carrier?: string | null
    trackingNumber?: string | null
    trackingUrl?: string | null
  }
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { shippingAddress: true },
  })

  if (!order || !order.shippingAddress) {
    console.error(`[email] sendShippedEmail: Order ${orderId} or shipping address not found`)
    return
  }

  const to = order.shippingAddress.email
  const customerName = order.shippingAddress.fullName

  try {
    const { data, error } = await getResend().emails.send({
      from: getFromEmail(),
      to,
      subject: `Din order har skickats — Artboris #${orderId.slice(0, 8)}`,
      react: ShippedNotification({
        customerName,
        orderId,
        carrier: fulfillmentData.carrier,
        trackingNumber: fulfillmentData.trackingNumber,
        trackingUrl: fulfillmentData.trackingUrl,
        shippingAddress: {
          address1: order.shippingAddress.address1,
          address2: order.shippingAddress.address2,
          postalCode: order.shippingAddress.postalCode,
          city: order.shippingAddress.city,
          countryCode: order.shippingAddress.countryCode,
        },
      }),
    })

    if (error) {
      console.error(`[email] sendShippedEmail failed:`, error)
    } else {
      console.log(`[email] Shipped notification sent to ${to} (id: ${data?.id})`)
    }
  } catch (err) {
    console.error(`[email] sendShippedEmail error:`, err)
  }
}

// ── Delivered Notification ──

export async function sendDeliveredEmail(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { shippingAddress: true },
  })

  if (!order || !order.shippingAddress) {
    console.error(`[email] sendDeliveredEmail: Order ${orderId} or shipping address not found`)
    return
  }

  const to = order.shippingAddress.email
  const customerName = order.shippingAddress.fullName

  try {
    const { data, error } = await getResend().emails.send({
      from: getFromEmail(),
      to,
      subject: `Din order har levererats — Artboris #${orderId.slice(0, 8)}`,
      react: DeliveredNotification({
        customerName,
        orderId,
      }),
    })

    if (error) {
      console.error(`[email] sendDeliveredEmail failed:`, error)
    } else {
      console.log(`[email] Delivered notification sent to ${to} (id: ${data?.id})`)
    }
  } catch (err) {
    console.error(`[email] sendDeliveredEmail error:`, err)
  }
}

// ── Artist Sale Notification (Market Order PAID) ──

export async function sendArtistSaleNotification(marketOrderId: string) {
  const marketOrder = await prisma.marketOrder.findUnique({
    where: { id: marketOrderId },
    include: {
      listing: {
        select: {
          title: true,
          imageUrl: true,
          isOriginal: true,
        },
      },
      artist: {
        select: {
          displayName: true,
          email: true,
          stripeAccountId: true,
          stripeOnboardingDone: true,
        },
      },
    },
  })

  if (!marketOrder) {
    console.error(`[email] sendArtistSaleNotification: MarketOrder ${marketOrderId} not found`)
    return
  }

  const to = marketOrder.artist.email
  if (!to) {
    console.error(`[email] sendArtistSaleNotification: Artist has no email for order ${marketOrderId}`)
    return
  }

  try {
    const { data, error } = await getResend().emails.send({
      from: getFromEmail(),
      to,
      subject: `Grattis! Ditt konstverk "${marketOrder.listing.title}" har sålts!`,
      react: ArtistSaleNotification({
        artistName: marketOrder.artist.displayName,
        artworkTitle: marketOrder.listing.title,
        artworkImageUrl: marketOrder.listing.imageUrl,
        sizeCode: marketOrder.sizeCode,
        frameColor: marketOrder.frameColor,
        artistShareSEK: Math.round(marketOrder.artistShareCents / 100),
        totalBuyerSEK: Math.round(marketOrder.totalCents / 100),
        buyerCity: marketOrder.buyerCity || 'Sverige',
        isOriginal: marketOrder.listing.isOriginal,
        hasStripeConnect: !!(marketOrder.artist.stripeAccountId && marketOrder.artist.stripeOnboardingDone),
        orderId: marketOrderId,
      }),
    })

    if (error) {
      console.error(`[email] sendArtistSaleNotification failed:`, error)
    } else {
      console.log(`[email] Artist sale notification sent to ${to} (id: ${data?.id})`)
    }
  } catch (err) {
    console.error(`[email] sendArtistSaleNotification error:`, err)
  }
}

// ── Retry helper ──

async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  maxRetries = 3,
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      if (attempt === maxRetries) throw err
      const delayMs = 1000 * Math.pow(2, attempt - 1) // 1s, 2s, 4s
      console.warn(`[email] ${label} attempt ${attempt}/${maxRetries} failed, retrying in ${delayMs}ms...`)
      await new Promise(r => setTimeout(r, delayMs))
    }
  }
  throw new Error('unreachable')
}

// ── Crimson: build order data (shared between regular + market orders) ──

interface CrimsonPrintItem {
  title: string
  imageUrl: string
  printFileUrl: string | null
  sizeCode: string
  productType: string
  frameColor: string
  paperType: string
  quantity: number
}

async function fetchPrintFileUrl(designId: string, sizeCode: string, productType: string): Promise<string | null> {
  const finalAsset = await prisma.designAsset.findFirst({
    where: { designId, role: 'PRINT_FINAL', sizeCode, productType: productType as any },
    orderBy: { createdAt: 'desc' },
    select: { url: true },
  })
  if (finalAsset) return finalAsset.url

  const printAsset = await prisma.designAsset.findFirst({
    where: { designId, role: 'PRINT', sizeCode, productType: productType as any },
    orderBy: { createdAt: 'desc' },
    select: { url: true },
  })
  return printAsset?.url || null
}

async function sendCrimsonEmail(params: {
  orderId: string
  orderDate: string
  items: CrimsonPrintItem[]
  customerName: string
  shippingAddress: {
    address1: string
    address2?: string | null
    postalCode: string
    city: string
    countryCode: string
  }
  customerEmail: string
  customerPhone?: string | null
  subjectPrefix?: string
}) {
  const crimsonEmail = process.env.CRIMSON_ORDER_EMAIL
  if (!crimsonEmail) {
    console.warn(`[email] CRIMSON_ORDER_EMAIL not set — skipping Crimson notification for ${params.orderId}`)
    return { sent: false, reason: 'no_email_configured' }
  }

  const prefix = params.subjectPrefix || 'Ny tryckorder'
  const itemCount = params.items.length

  const { data, error } = await withRetry(
    () => getResend().emails.send({
      from: getFromEmail(),
      to: crimsonEmail,
      subject: `${prefix} — Artboris #${params.orderId.slice(0, 8)} (${itemCount} artikel${itemCount > 1 ? 'ar' : ''})`,
      react: CrimsonOrderNotification({
        orderId: params.orderId,
        orderDate: params.orderDate,
        items: params.items,
        customerName: params.customerName,
        shippingAddress: params.shippingAddress,
        customerEmail: params.customerEmail,
        customerPhone: params.customerPhone,
      }),
    }),
    `Crimson email for ${params.orderId}`,
  )

  if (error) {
    console.error(`[email] sendCrimsonEmail failed after retries:`, error)
    return { sent: false, reason: 'send_failed', error }
  }

  console.log(`[email] Crimson notification sent to ${crimsonEmail} (id: ${data?.id})`)
  return { sent: true, emailId: data?.id }
}

// ── Crimson Print Partner Order Notification ──

export async function sendCrimsonOrderEmail(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      shippingAddress: true,
      items: {
        include: {
          design: { select: { title: true, imageUrl: true } },
          fulfillment: true,
        },
      },
    },
  })

  if (!order || !order.shippingAddress) {
    console.error(`[email] sendCrimsonOrderEmail: Order ${orderId} or shipping address not found`)
    return
  }

  const items: CrimsonPrintItem[] = await Promise.all(
    order.items.map(async (item) => ({
      title: item.design.title,
      imageUrl: item.design.imageUrl,
      printFileUrl: await fetchPrintFileUrl(item.designId, item.sizeCode, item.productType),
      sizeCode: item.sizeCode,
      productType: item.productType,
      frameColor: item.frameColor,
      paperType: item.paperType,
      quantity: item.quantity,
    }))
  )

  const orderDate = order.createdAt.toLocaleDateString('sv-SE', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  const result = await sendCrimsonEmail({
    orderId,
    orderDate,
    items,
    customerName: order.shippingAddress.fullName,
    shippingAddress: {
      address1: order.shippingAddress.address1,
      address2: order.shippingAddress.address2,
      postalCode: order.shippingAddress.postalCode,
      city: order.shippingAddress.city,
      countryCode: order.shippingAddress.countryCode,
    },
    customerEmail: order.shippingAddress.email,
    customerPhone: order.shippingAddress.phone,
  })

  if (result.sent) {
    for (const item of order.items) {
      if (item.fulfillment) {
        await prisma.fulfillment.update({
          where: { id: item.fulfillment.id },
          data: { status: 'SENT_TO_PARTNER', sentToPartnerAt: new Date() },
        })
      }
    }
    console.log(`[email] Fulfillments marked SENT_TO_PARTNER for order ${orderId}`)
  }
}

// ── Crimson: Market Order Notification ──

export async function sendCrimsonMarketOrderEmail(marketOrderId: string) {
  const marketOrder = await prisma.marketOrder.findUnique({
    where: { id: marketOrderId },
    include: {
      listing: {
        select: {
          title: true,
          imageUrl: true,
          printUrl: true,
          imageWidthPx: true,
          imageHeightPx: true,
        },
      },
    },
  })

  if (!marketOrder) {
    console.error(`[email] sendCrimsonMarketOrderEmail: MarketOrder ${marketOrderId} not found`)
    return
  }

  const items: CrimsonPrintItem[] = [{
    title: marketOrder.listing.title,
    imageUrl: marketOrder.listing.imageUrl,
    printFileUrl: marketOrder.listing.printUrl || marketOrder.listing.imageUrl,
    sizeCode: marketOrder.sizeCode,
    productType: 'POSTER',
    frameColor: marketOrder.frameColor,
    paperType: marketOrder.paperType,
    quantity: 1,
  }]

  const orderDate = marketOrder.createdAt.toLocaleDateString('sv-SE', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  await sendCrimsonEmail({
    orderId: marketOrderId,
    orderDate,
    items,
    customerName: marketOrder.buyerName || 'Okänd kund',
    shippingAddress: {
      address1: marketOrder.buyerAddress,
      postalCode: marketOrder.buyerPostalCode,
      city: marketOrder.buyerCity,
      countryCode: marketOrder.buyerCountry,
    },
    customerEmail: marketOrder.buyerEmail,
    subjectPrefix: 'Ny Market-tryckorder',
  })
}
