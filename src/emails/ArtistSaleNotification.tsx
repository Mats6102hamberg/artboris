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

interface ArtistSaleNotificationProps {
  artistName: string
  artworkTitle: string
  artworkImageUrl: string
  sizeCode: string
  frameColor: string
  artistShareSEK: number
  totalBuyerSEK: number
  buyerCity: string
  isOriginal: boolean
  hasStripeConnect: boolean
  orderId: string
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

export default function ArtistSaleNotification({
  artistName,
  artworkTitle,
  artworkImageUrl,
  sizeCode,
  frameColor,
  artistShareSEK,
  totalBuyerSEK,
  buyerCity,
  isOriginal,
  hasStripeConnect,
  orderId,
}: ArtistSaleNotificationProps) {
  return (
    <Html>
      <Head />
      <Preview>Grattis {artistName}! Ditt konstverk "{artworkTitle}" har sålts!</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>ARTBORIS</Text>
          </Section>

          <Section style={content}>
            <Heading style={h1}>Ditt konstverk har sålts!</Heading>
            <Text style={paragraph}>
              Hej {artistName}! Fantastiska nyheter — någon i {buyerCity} har just köpt ditt konstverk.
            </Text>

            <Hr style={hr} />

            {/* Artwork info */}
            <Section style={itemRow}>
              <Row>
                <Column style={itemImageCol}>
                  <Img
                    src={artworkImageUrl}
                    width={100}
                    height={120}
                    alt={artworkTitle}
                    style={itemImage}
                  />
                </Column>
                <Column style={itemDetailsCol}>
                  <Text style={itemTitle}>{artworkTitle}</Text>
                  <Text style={itemMeta}>
                    {isOriginal ? 'Original' : 'Print'} · {sizeCode} cm · {formatFrame(frameColor)}
                  </Text>
                  <Text style={itemMeta}>
                    Order: <span style={mono}>{orderId.slice(0, 12)}</span>
                  </Text>
                </Column>
              </Row>
            </Section>

            <Hr style={hr} />

            {/* Earnings */}
            <Section style={earningsSection}>
              <Text style={earningsLabel}>Din intäkt för denna försäljning</Text>
              <Text style={earningsAmount}>{artistShareSEK.toLocaleString('sv-SE')} kr</Text>
              <Text style={earningsNote}>
                (Köparen betalade totalt {totalBuyerSEK.toLocaleString('sv-SE')} kr inkl. tryck, ram och frakt)
              </Text>
            </Section>

            <Hr style={hr} />

            {/* Payout info */}
            <Text style={paragraph}>
              {hasStripeConnect
                ? 'Din intäkt överförs automatiskt till ditt kopplade Stripe-konto inom 2-7 bankdagar.'
                : 'Vi kontaktar dig inom kort angående utbetalning. Koppla gärna Stripe Connect i din konstnärsprofil för automatiska utbetalningar.'}
            </Text>

            <Text style={footerText}>
              Konstverket trycks och ramas av Crimson i Stockholm och skickas direkt till köparen.
              Du behöver inte göra något — vi sköter allt!
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

const hr: React.CSSProperties = {
  borderColor: '#e5e5e5',
  margin: '20px 0',
}

const itemRow: React.CSSProperties = {
  marginBottom: '16px',
}

const itemImageCol: React.CSSProperties = {
  width: '110px',
  verticalAlign: 'top',
}

const itemImage: React.CSSProperties = {
  borderRadius: '6px',
  objectFit: 'cover' as const,
}

const itemDetailsCol: React.CSSProperties = {
  verticalAlign: 'top',
  paddingLeft: '16px',
}

const itemTitle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 600,
  color: '#111',
  margin: '0 0 6px',
}

const itemMeta: React.CSSProperties = {
  fontSize: '13px',
  color: '#666',
  margin: '0 0 4px',
}

const mono: React.CSSProperties = {
  fontFamily: 'monospace',
  backgroundColor: '#f0f0f0',
  padding: '2px 6px',
  borderRadius: '4px',
}

const earningsSection: React.CSSProperties = {
  textAlign: 'center' as const,
  padding: '16px 0',
}

const earningsLabel: React.CSSProperties = {
  fontSize: '14px',
  color: '#666',
  margin: '0 0 8px',
}

const earningsAmount: React.CSSProperties = {
  fontSize: '36px',
  fontWeight: 700,
  color: '#16a34a',
  margin: '0 0 8px',
}

const earningsNote: React.CSSProperties = {
  fontSize: '12px',
  color: '#999',
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
