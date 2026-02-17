# SESSION SUMMARY — Artboris

## Projekt
- **Namn:** Artboris (Art Scanner / WallCraft / Poster Lab)
- **Lokal mapp:** `/Users/matshamberg/CascadeProjects/Artboris`
- **GitHub:** `https://github.com/Mats6102hamberg/artboris.git`
- **Branch:** `main`
- **Deploy:** Vercel (kopplat till GitHub-repot)
- **Senaste commit:** `36980a6`

## Tech Stack
- Next.js 16, React 19, TypeScript
- Tailwind CSS 4
- Prisma + Neon Postgres
- Replicate (Flux Schnell / Flux Dev) for AI image generation
- Stripe (betalning), Resend (e-post), Vercel Blob (lagring)

## Vad som implementerades denna session

### 1. Orderbekräftelse e-postval
- **Checkout:** Kund väljer "Skicka till min e-post" eller "Skicka till annan e-post"
- **Success-sida:** Knapp för att skicka orderbekräftelse till valfri e-post efter betalning
- **Prisma:** `confirmationEmail` (nullable) i ShippingAddress
- **API:** `/api/orders/send-receipt` (GET/POST) — hämta/skicka bekräftelse
- **Stripe:** `customer_email` sätts till vald mejl

### 2. Crimson tryckpartner-integration
- **Automatisk order:** E-post till Crimson skickas automatiskt vid betalad order (Stripe webhook)
- **E-postmall:** `CrimsonOrderNotification.tsx` — professionell mall med tryckfilslänkar, specs, leveransadress
- **Retry-mekanism:** Exponentiell backoff (3 försök: 1s, 2s, 4s) för alla e-postutskick
- **Admin resend:** "↻ Crimson"-knapp i admin/orders för att skicka om order till Crimson
- **Crimson webhook:** `POST /api/webhook/crimson` — tar emot statusuppdateringar (received, in_production, shipped)
- **Market-ordrar:** Crimson-mail skickas även för marketplace-ordrar
- **Delade funktioner:** `sendCrimsonEmail()`, `fetchPrintFileUrl()` — återanvändbar infrastruktur

### 3. Admin-prispanel (DB-driven priskonfiguration)
- **PricingConfig-modell:** Prisma-modell med JSON-fält för storlekar, ramar, papper + frakt/moms
- **Admin API:** `GET/PATCH /api/admin/pricing` — hämta/uppdatera priser, auto-seed vid första anrop
- **Publik API:** `GET /api/pricing` — strippar costSEK (kundinriktat), cachad 5 min
- **Server-side pricing:** `getPricingConfig()` med in-memory cache (5 min TTL), `calculateServerPrice()`
- **Admin-sida:** `/admin/pricing` — inline-redigering, marginalberäkning (%), färgkodad (grön/amber/röd)
- **Server-side prisvalidering:** Checkout beräknar pris server-side, loggar varning vid avvikelse > 1 kr
- **Säkerhet:** Klienten kan inte längre manipulera unitPriceCents

### 4. MockupPreview mobilförbättring
- **Resize-handtag:** 28px → 48px på touch-enheter (Apple minimum 44px)
- **Synliga hörnmarkeringar:** Vita L-formade hörn med skugga, alltid synliga på touch
- **+/- knappar:** Storleksändring via knappar nere till höger med procent-visning
- **Pinch-to-zoom hint:** "Nyp för att zooma" visas 3 sek på mobil

## Environment Variables (krävs)
- `REPLICATE_API_TOKEN` — Replicate API-nyckel
- `DATABASE_URL` — Neon Postgres connection string
- `DATABASE_URL_UNPOOLED` — Neon Postgres direkt-anslutning
- `STRIPE_SECRET_KEY` — Stripe test/live nyckel
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook signing secret
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Stripe publishable key
- `NEXT_PUBLIC_APP_URL` — App URL (localhost eller Vercel)
- `RESEND_API_KEY` — Resend e-posttjänst
- `CRIMSON_ORDER_EMAIL` — E-postadress för tryckorder till Crimson
- `CRIMSON_WEBHOOK_SECRET` — Hemlig nyckel för Crimson webhook

### 5. "Mina Tavlor" user-scoped
- **Prisma:** `userId` (String, default "") tillagd i `Artwork`-modellen + `@@index([userId])`
- **API:** `/api/my-artworks` — alla endpoints (GET/POST/PUT/DELETE) autentiserade via `getUserId()`
- **Ownership-check:** PUT/DELETE verifierar att `artwork.userId === userId` innan ändring
- **Mönster:** Samma som `ScannerPortfolioItem` — auth + anon fallback

## Kända issues / TODO
- Market checkout saknar orderbekräftelse-mejlval (bara Wallcraft + Poster Lab har det)
- Crimson-priser (costSEK) behöver fyllas i efter avtal med Crimson
- Frame-assets är PNG-placeholders, behöver riktiga rambilder

## Git-historik denna session
```
36980a6 fix: bättre touch-hantering i MockupPreview för mobil
d1b191a feat: admin-prispanel — DB-driven priskonfiguration + server-side prisvalidering
a274aca feat: 4 Crimson-förbättringar — retry, admin resend, webhook, market-ordrar
abd6905 feat: automatisk tryckorder till Crimson via e-post vid betalad order
3f8d401 feat: orderbekräftelse e-postval på success-sidan
a2b7fa0 feat: orderbekräftelse e-postval i checkout + auth, admin, SEO & client-komponent-refaktor
```
