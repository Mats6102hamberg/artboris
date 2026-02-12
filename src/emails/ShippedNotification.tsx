import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface ShippedNotificationProps {
  customerName: string
  orderId: string
  carrier?: string | null
  trackingNumber?: string | null
  trackingUrl?: string | null
  shippingAddress: {
    address1: string
    address2?: string | null
    postalCode: string
    city: string
    countryCode: string
  }
}

export default function ShippedNotification({
  customerName,
  orderId,
  carrier,
  trackingNumber,
  trackingUrl,
  shippingAddress,
}: ShippedNotificationProps) {
  return (
    <Html>
      <Head />
      <Preview>Din order från Artboris har skickats!</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>ARTBORIS</Text>
          </Section>

          <Section style={content}>
            <Heading style={h1}>Din order är på väg!</Heading>
            <Text style={paragraph}>
              Hej {customerName}! Vi har skickat din beställning och den är nu på väg till dig.
            </Text>

            <Text style={orderIdText}>
              Order: <span style={mono}>{orderId.slice(0, 12)}…</span>
            </Text>

            <Hr style={hr} />

            {/* Tracking info */}
            {(carrier || trackingNumber) && (
              <Section style={trackingSection}>
                <Text style={sectionTitle}>Spårningsinformation</Text>
                {carrier && (
                  <Text style={trackingDetail}>
                    <span style={trackingLabel}>Transportör:</span> {carrier}
                  </Text>
                )}
                {trackingNumber && (
                  <Text style={trackingDetail}>
                    <span style={trackingLabel}>Spårningsnummer:</span>{' '}
                    {trackingUrl ? (
                      <Link href={trackingUrl} style={trackingLink}>
                        {trackingNumber}
                      </Link>
                    ) : (
                      <span style={mono}>{trackingNumber}</span>
                    )}
                  </Text>
                )}
                {trackingUrl && (
                  <Section style={buttonContainer}>
                    <Link href={trackingUrl} style={trackButton}>
                      Spåra ditt paket
                    </Link>
                  </Section>
                )}
              </Section>
            )}

            <Hr style={hr} />

            {/* Shipping address */}
            <Section>
              <Text style={sectionTitle}>Levereras till</Text>
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
              Leveransen tar normalt 3–5 arbetsdagar. Kontakta oss om du har frågor.
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

const trackingSection: React.CSSProperties = {
  padding: '16px 20px',
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
}

const sectionTitle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#111',
  margin: '0 0 10px',
}

const trackingDetail: React.CSSProperties = {
  fontSize: '14px',
  color: '#333',
  margin: '0 0 6px',
  lineHeight: '22px',
}

const trackingLabel: React.CSSProperties = {
  color: '#888',
}

const trackingLink: React.CSSProperties = {
  color: '#2563eb',
  textDecoration: 'underline',
  fontFamily: 'monospace',
}

const buttonContainer: React.CSSProperties = {
  textAlign: 'center' as const,
  marginTop: '16px',
}

const trackButton: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#111',
  color: '#fff',
  fontSize: '14px',
  fontWeight: 600,
  padding: '12px 28px',
  borderRadius: '8px',
  textDecoration: 'none',
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
