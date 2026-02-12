import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Row,
  Column,
} from '@react-email/components'
import * as React from 'react'

interface OrderItem {
  title: string
  imageUrl: string
  sizeCode: string
  productType: string
  frameColor: string
  quantity: number
  lineTotalCents: number
}

interface OrderConfirmationProps {
  customerName: string
  orderId: string
  items: OrderItem[]
  subtotalCents: number
  shippingCents: number
  totalCents: number
  currency: string
  shippingAddress: {
    address1: string
    address2?: string | null
    postalCode: string
    city: string
    countryCode: string
  }
}

function formatCents(cents: number, currency = 'SEK') {
  return `${(cents / 100).toFixed(0)} ${currency}`
}

function formatProductType(type: string) {
  const map: Record<string, string> = {
    POSTER: 'Poster',
    CANVAS: 'Canvas',
    METAL: 'Metalltryck',
    FRAMED_POSTER: 'Inramad poster',
  }
  return map[type] || type
}

function formatFrame(color: string) {
  const map: Record<string, string> = {
    NONE: 'Utan ram',
    BLACK: 'Svart ram',
    WHITE: 'Vit ram',
    OAK: 'Ekram',
    WALNUT: 'Valnötsram',
  }
  return map[color] || color
}

export default function OrderConfirmation({
  customerName,
  orderId,
  items,
  subtotalCents,
  shippingCents,
  totalCents,
  currency,
  shippingAddress,
}: OrderConfirmationProps) {
  return (
    <Html>
      <Head />
      <Preview>Tack för din beställning hos Artboris!</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>ARTBORIS</Text>
          </Section>

          <Section style={content}>
            <Heading style={h1}>Orderbekräftelse</Heading>
            <Text style={paragraph}>
              Hej {customerName}! Tack för din beställning. Vi har mottagit din order och börjar förbereda den.
            </Text>

            <Text style={orderIdText}>
              Order: <span style={mono}>{orderId.slice(0, 12)}…</span>
            </Text>

            <Hr style={hr} />

            {/* Items */}
            {items.map((item, i) => (
              <Section key={i} style={itemRow}>
                <Row>
                  <Column style={itemImageCol}>
                    <Img
                      src={item.imageUrl}
                      width={80}
                      height={100}
                      alt={item.title}
                      style={itemImage}
                    />
                  </Column>
                  <Column style={itemDetailsCol}>
                    <Text style={itemTitle}>{item.title}</Text>
                    <Text style={itemMeta}>
                      {formatProductType(item.productType)} · {item.sizeCode} cm · {formatFrame(item.frameColor)}
                    </Text>
                    <Text style={itemMeta}>
                      {item.quantity}st — {formatCents(item.lineTotalCents, currency)}
                    </Text>
                  </Column>
                </Row>
              </Section>
            ))}

            <Hr style={hr} />

            {/* Totals */}
            <Section style={totalsSection}>
              <Row>
                <Column><Text style={totalLabel}>Delsumma</Text></Column>
                <Column align="right"><Text style={totalValue}>{formatCents(subtotalCents, currency)}</Text></Column>
              </Row>
              <Row>
                <Column><Text style={totalLabel}>Frakt</Text></Column>
                <Column align="right"><Text style={totalValue}>{shippingCents > 0 ? formatCents(shippingCents, currency) : 'Gratis'}</Text></Column>
              </Row>
              <Hr style={hrThin} />
              <Row>
                <Column><Text style={totalLabelBold}>Totalt</Text></Column>
                <Column align="right"><Text style={totalValueBold}>{formatCents(totalCents, currency)}</Text></Column>
              </Row>
            </Section>

            <Hr style={hr} />

            {/* Shipping address */}
            <Section>
              <Text style={sectionTitle}>Leveransadress</Text>
              <Text style={addressText}>
                {customerName}<br />
                {shippingAddress.address1}<br />
                {shippingAddress.address2 && <>{shippingAddress.address2}<br /></>}
                {shippingAddress.postalCode} {shippingAddress.city}<br />
                {shippingAddress.countryCode}
              </Text>
            </Section>

            <Hr style={hr} />

            <Text style={footerText}>
              Vi skickar ett nytt mail med spårningsinformation när din order har skickats.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerSmall}>
              © {new Date().getFullYear()} Artboris. Alla rättigheter förbehållna.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main: React.CSSProperties = {
  backgroundColor: '#f6f6f6',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const container: React.CSSProperties = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '20px 0',
}

const header: React.CSSProperties = {
  backgroundColor: '#111',
  padding: '24px 32px',
  borderRadius: '12px 12px 0 0',
}

const logo: React.CSSProperties = {
  color: '#fff',
  fontSize: '20px',
  fontWeight: 700,
  letterSpacing: '3px',
  margin: 0,
}

const content: React.CSSProperties = {
  backgroundColor: '#fff',
  padding: '32px',
}

const h1: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 700,
  color: '#111',
  margin: '0 0 12px',
}

const paragraph: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#333',
  margin: '0 0 16px',
}

const orderIdText: React.CSSProperties = {
  fontSize: '14px',
  color: '#666',
  margin: '0 0 16px',
}

const mono: React.CSSProperties = {
  fontFamily: 'monospace',
  backgroundColor: '#f0f0f0',
  padding: '2px 6px',
  borderRadius: '4px',
}

const hr: React.CSSProperties = {
  borderColor: '#e5e5e5',
  margin: '20px 0',
}

const hrThin: React.CSSProperties = {
  borderColor: '#e5e5e5',
  margin: '8px 0',
}

const itemRow: React.CSSProperties = {
  marginBottom: '16px',
}

const itemImageCol: React.CSSProperties = {
  width: '90px',
  verticalAlign: 'top',
}

const itemImage: React.CSSProperties = {
  borderRadius: '6px',
  objectFit: 'cover' as const,
}

const itemDetailsCol: React.CSSProperties = {
  verticalAlign: 'top',
  paddingLeft: '12px',
}

const itemTitle: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 600,
  color: '#111',
  margin: '0 0 4px',
}

const itemMeta: React.CSSProperties = {
  fontSize: '13px',
  color: '#666',
  margin: '0 0 2px',
}

const totalsSection: React.CSSProperties = {
  padding: '0',
}

const totalLabel: React.CSSProperties = {
  fontSize: '14px',
  color: '#666',
  margin: '4px 0',
}

const totalValue: React.CSSProperties = {
  fontSize: '14px',
  color: '#333',
  margin: '4px 0',
  textAlign: 'right' as const,
}

const totalLabelBold: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 700,
  color: '#111',
  margin: '4px 0',
}

const totalValueBold: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 700,
  color: '#111',
  margin: '4px 0',
  textAlign: 'right' as const,
}

const sectionTitle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#111',
  margin: '0 0 8px',
}

const addressText: React.CSSProperties = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#444',
  margin: 0,
}

const footerText: React.CSSProperties = {
  fontSize: '14px',
  color: '#888',
  margin: '0',
  lineHeight: '22px',
}

const footer: React.CSSProperties = {
  padding: '20px 32px',
  textAlign: 'center' as const,
}

const footerSmall: React.CSSProperties = {
  fontSize: '12px',
  color: '#aaa',
  margin: 0,
}
