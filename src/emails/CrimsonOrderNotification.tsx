import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Row,
  Column,
} from '@react-email/components'
import * as React from 'react'

interface PrintItem {
  title: string
  imageUrl: string
  printFileUrl: string | null
  sizeCode: string
  productType: string
  frameColor: string
  paperType: string
  quantity: number
}

interface CrimsonOrderProps {
  orderId: string
  orderDate: string
  items: PrintItem[]
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
    GOLD: 'Guldram',
  }
  return map[color] || color
}

function formatPaper(type: string) {
  const map: Record<string, string> = {
    DEFAULT: 'Standard',
    MATTE: 'Matt',
    SEMI_GLOSS: 'Semi-gloss',
    FINE_ART: 'Fine Art',
  }
  return map[type] || type
}

export default function CrimsonOrderNotification({
  orderId,
  orderDate,
  items,
  customerName,
  shippingAddress,
  customerEmail,
  customerPhone,
}: CrimsonOrderProps) {
  return (
    <Html>
      <Head />
      <Preview>{`Ny tryckorder fran Artboris — ${items.length} artikel(ar)`}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Row>
              <Column>
                <Text style={logo}>ARTBORIS</Text>
                <Text style={subtitle}>TRYCKORDER</Text>
              </Column>
              <Column align="right">
                <Text style={headerDate}>{orderDate}</Text>
              </Column>
            </Row>
          </Section>

          <Section style={content}>
            <Text style={orderRef}>
              Order-ID: <span style={mono}>{orderId}</span>
            </Text>

            <Hr style={hr} />

            {/* Items */}
            <Heading as="h2" style={h2}>Artiklar att trycka</Heading>

            {items.map((item, i) => (
              <Section key={i} style={itemCard}>
                <Row>
                  <Column style={itemImageCol}>
                    <Img
                      src={item.imageUrl}
                      width={100}
                      height={120}
                      alt={item.title}
                      style={itemImage}
                    />
                  </Column>
                  <Column style={itemDetailsCol}>
                    <Text style={itemTitle}>{item.title}</Text>
                    <Text style={itemSpec}>Typ: {formatProductType(item.productType)}</Text>
                    <Text style={itemSpec}>Storlek: {item.sizeCode} cm</Text>
                    <Text style={itemSpec}>Ram: {formatFrame(item.frameColor)}</Text>
                    <Text style={itemSpec}>Papper: {formatPaper(item.paperType)}</Text>
                    <Text style={itemSpec}>Antal: {item.quantity} st</Text>
                    {item.printFileUrl ? (
                      <Link href={item.printFileUrl} style={downloadLink}>
                        Ladda ner tryckfil
                      </Link>
                    ) : (
                      <Text style={printPending}>Tryckfil genereras — skickas separat</Text>
                    )}
                  </Column>
                </Row>
              </Section>
            ))}

            <Hr style={hr} />

            {/* Shipping */}
            <Heading as="h2" style={h2}>Leveransadress</Heading>
            <Section style={addressCard}>
              <Text style={addressText}>
                {customerName}<br />
                {shippingAddress.address1}<br />
                {shippingAddress.address2 && <>{shippingAddress.address2}<br /></>}
                {shippingAddress.postalCode} {shippingAddress.city}<br />
                {shippingAddress.countryCode}
              </Text>
              <Hr style={hrThin} />
              <Text style={contactText}>
                E-post: {customerEmail}
                {customerPhone && <><br />Telefon: {customerPhone}</>}
              </Text>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Detta ar en automatisk order fran Artboris.
              Vid fragor, kontakta oss pa order@artboris.se
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main: React.CSSProperties = {
  backgroundColor: '#f0f0f0',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const container: React.CSSProperties = {
  maxWidth: '600px',
  margin: '0 auto',
  padding: '20px 0',
}

const header: React.CSSProperties = {
  backgroundColor: '#1a1a2e',
  padding: '24px 32px',
  borderRadius: '12px 12px 0 0',
}

const logo: React.CSSProperties = {
  color: '#fff',
  fontSize: '18px',
  fontWeight: 700,
  letterSpacing: '3px',
  margin: '0',
}

const subtitle: React.CSSProperties = {
  color: '#8b8ba3',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '2px',
  margin: '4px 0 0',
}

const headerDate: React.CSSProperties = {
  color: '#8b8ba3',
  fontSize: '13px',
  margin: 0,
  textAlign: 'right' as const,
}

const content: React.CSSProperties = {
  backgroundColor: '#fff',
  padding: '32px',
}

const orderRef: React.CSSProperties = {
  fontSize: '14px',
  color: '#555',
  margin: '0 0 8px',
}

const mono: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '13px',
  backgroundColor: '#f5f5f5',
  padding: '3px 8px',
  borderRadius: '4px',
  color: '#333',
}

const h2: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 700,
  color: '#111',
  margin: '0 0 16px',
}

const hr: React.CSSProperties = {
  borderColor: '#e5e5e5',
  margin: '24px 0',
}

const hrThin: React.CSSProperties = {
  borderColor: '#eee',
  margin: '12px 0',
}

const itemCard: React.CSSProperties = {
  backgroundColor: '#fafafa',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '12px',
  border: '1px solid #eee',
}

const itemImageCol: React.CSSProperties = {
  width: '110px',
  verticalAlign: 'top',
}

const itemImage: React.CSSProperties = {
  borderRadius: '6px',
  objectFit: 'cover' as const,
  border: '1px solid #ddd',
}

const itemDetailsCol: React.CSSProperties = {
  verticalAlign: 'top',
  paddingLeft: '16px',
}

const itemTitle: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 600,
  color: '#111',
  margin: '0 0 8px',
}

const itemSpec: React.CSSProperties = {
  fontSize: '13px',
  color: '#555',
  margin: '0 0 3px',
  lineHeight: '20px',
}

const downloadLink: React.CSSProperties = {
  display: 'inline-block',
  marginTop: '8px',
  fontSize: '13px',
  fontWeight: 600,
  color: '#2563eb',
  textDecoration: 'underline',
}

const printPending: React.CSSProperties = {
  marginTop: '8px',
  fontSize: '12px',
  color: '#c59000',
  fontStyle: 'italic',
  margin: '8px 0 0',
}

const addressCard: React.CSSProperties = {
  backgroundColor: '#fafafa',
  borderRadius: '8px',
  padding: '16px',
  border: '1px solid #eee',
}

const addressText: React.CSSProperties = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#333',
  margin: 0,
}

const contactText: React.CSSProperties = {
  fontSize: '13px',
  lineHeight: '20px',
  color: '#666',
  margin: 0,
}

const footer: React.CSSProperties = {
  padding: '20px 32px',
  textAlign: 'center' as const,
}

const footerText: React.CSSProperties = {
  fontSize: '12px',
  color: '#999',
  margin: 0,
  lineHeight: '18px',
}
