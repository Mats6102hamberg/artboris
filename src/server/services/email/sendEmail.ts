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

// ── Crimson Print Partner Order Notification ──

export async function sendCrimsonOrderEmail(orderId: string) {
  const crimsonEmail = process.env.CRIMSON_ORDER_EMAIL
  if (!crimsonEmail) {
    console.warn(`[email] CRIMSON_ORDER_EMAIL not set — skipping Crimson notification for ${orderId}`)
    return
  }

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

  // Fetch print assets for each item
  const itemsWithPrintFiles = await Promise.all(
    order.items.map(async (item) => {
      const printAsset = await prisma.designAsset.findFirst({
        where: {
          designId: item.designId,
          role: 'PRINT',
          sizeCode: item.sizeCode,
          productType: item.productType,
        },
        orderBy: { createdAt: 'desc' },
      })

      // Also check for PRINT_FINAL (higher priority)
      const finalAsset = await prisma.designAsset.findFirst({
        where: {
          designId: item.designId,
          role: 'PRINT_FINAL',
          sizeCode: item.sizeCode,
          productType: item.productType,
        },
        orderBy: { createdAt: 'desc' },
      })

      return {
        title: item.design.title,
        imageUrl: item.design.imageUrl,
        printFileUrl: finalAsset?.url || printAsset?.url || null,
        sizeCode: item.sizeCode,
        productType: item.productType,
        frameColor: item.frameColor,
        paperType: item.paperType,
        quantity: item.quantity,
      }
    })
  )

  const orderDate = order.createdAt.toLocaleDateString('sv-SE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  try {
    const { data, error } = await getResend().emails.send({
      from: getFromEmail(),
      to: crimsonEmail,
      subject: `Ny tryckorder — Artboris #${orderId.slice(0, 8)} (${order.items.length} artikel${order.items.length > 1 ? 'ar' : ''})`,
      react: CrimsonOrderNotification({
        orderId,
        orderDate,
        items: itemsWithPrintFiles,
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
      }),
    })

    if (error) {
      console.error(`[email] sendCrimsonOrderEmail failed:`, error)
    } else {
      console.log(`[email] Crimson order notification sent to ${crimsonEmail} (id: ${data?.id})`)

      // Mark fulfillments as SENT_TO_PARTNER
      for (const item of order.items) {
        if (item.fulfillment) {
          await prisma.fulfillment.update({
            where: { id: item.fulfillment.id },
            data: {
              status: 'SENT_TO_PARTNER',
              sentToPartnerAt: new Date(),
            },
          })
        }
      }
      console.log(`[email] Fulfillments marked SENT_TO_PARTNER for order ${orderId}`)
    }
  } catch (err) {
    console.error(`[email] sendCrimsonOrderEmail error:`, err)
  }
}
