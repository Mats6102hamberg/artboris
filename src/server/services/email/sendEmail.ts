import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'
import OrderConfirmation from '@/emails/OrderConfirmation'
import ShippedNotification from '@/emails/ShippedNotification'
import DeliveredNotification from '@/emails/DeliveredNotification'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.EMAIL_FROM || 'Artboris <order@artboris.se>'

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

  const to = order.shippingAddress.email
  const customerName = order.shippingAddress.fullName

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Orderbekräftelse — Artboris #${orderId.slice(0, 8)}`,
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
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
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
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
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
