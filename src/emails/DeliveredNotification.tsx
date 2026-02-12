import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface DeliveredNotificationProps {
  customerName: string
  orderId: string
}

export default function DeliveredNotification({
  customerName,
  orderId,
}: DeliveredNotificationProps) {
  return (
    <Html>
      <Head />
      <Preview>Din beställning från Artboris har levererats!</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>ARTBORIS</Text>
          </Section>

          <Section style={content}>
            <Heading style={h1}>Din order har levererats!</Heading>
            <Text style={paragraph}>
              Hej {customerName}! Din beställning har nu levererats. Vi hoppas att du är nöjd med ditt konstverk!
            </Text>

            <Text style={orderIdText}>
              Order: <span style={mono}>{orderId.slice(0, 12)}…</span>
            </Text>

            <Hr style={hr} />

            <Section style={tipSection}>
              <Text style={tipTitle}>Tips för upphängning</Text>
              <Text style={tipText}>
                Undvik direkt solljus för att bevara färgerna. Använd en vattenpass för att få tavlan rak.
                Häng den i ögonhöjd (ca 150 cm från golv till mitten av tavlan) för bästa effekt.
              </Text>
            </Section>

            <Hr style={hr} />

            <Text style={footerText}>
              Har du frågor eller synpunkter? Svara på detta mail så hjälper vi dig.
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

const tipSection: React.CSSProperties = {
  padding: '16px 20px',
  backgroundColor: '#fefce8',
  borderRadius: '8px',
  border: '1px solid #fef08a',
}

const tipTitle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#854d0e',
  margin: '0 0 8px',
}

const tipText: React.CSSProperties = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#713f12',
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
