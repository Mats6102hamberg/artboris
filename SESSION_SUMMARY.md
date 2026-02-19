# SESSION SUMMARY — Artboris

## Projekt
- **Namn:** Artboris (Art Scanner / WallCraft / Poster Lab)
- **Lokal mapp:** `/Users/matshamberg/CascadeProjects/Artboris`
- **GitHub:** `https://github.com/Mats6102hamberg/artboris.git`
- **Branch:** `main`
- **Deploy:** Vercel (kopplat till GitHub-repot)
- **Senaste commit:** `1c73c82`

## Tech Stack
- Next.js 16, React 19, TypeScript
- Tailwind CSS 4
- Prisma + Neon Postgres
- Replicate (Flux Schnell / Flux Dev) for AI image generation
- Stripe (betalning), Resend (e-post), Vercel Blob (lagring)
- Sentry (felmonitorering), CrashCatcher (förbered, ej aktivt)

## Vad som implementerades (alla sessioner)

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
- `NEXT_PUBLIC_SENTRY_DSN` — Sentry DSN (felmonitorering)
- `SENTRY_ORG` — Sentry organisation (artboris)
- `SENTRY_PROJECT` — Sentry projekt (javascript-nextjs)
- `ADMIN_ALERT_EMAIL` — Admin e-post för felnotifieringar (mhg10mhg@gmail.com)
- `CRASHCATCHER_API_URL` — CrashCatcher URL (valfritt, ej aktivt)
- `CRASHCATCHER_API_KEY` — CrashCatcher API-nyckel (valfritt)

### 5. "Mina Tavlor" user-scoped
- **Prisma:** `userId` (String, default "") tillagd i `Artwork`-modellen + `@@index([userId])`
- **API:** `/api/my-artworks` — alla endpoints (GET/POST/PUT/DELETE) autentiserade via `getUserId()`
- **Ownership-check:** PUT/DELETE verifierar att `artwork.userId === userId` innan ändring
- **Mönster:** Samma som `ScannerPortfolioItem` — auth + anon fallback

### 6. AI Fallback + admin-notifikation
- **withAIRetry:** Retry med exponentiell backoff + felklassificering (transient vs permanent)
- **Cross-provider fallback:** Replicate Flux ↔ DALL-E 3 (generatePreview, refinePreview)
- **Admin email alerts:** Via Resend med 5 min debounce per tjänst till `mhg10mhg@gmail.com`
- **Filer:** `withAIRetry.ts`, `adminAlert.ts` (sendAIAdminAlert + sendErrorAdminAlert)

### 7. CrashCatcher + Supertestaren-integration (förberett)
- **crashcatcher.ts:** HTTP-klient med debounce, rapporterar till CrashCatcher API (ej aktivt utan `CRASHCATCHER_API_URL`)
- **Health endpoint:** `GET /api/health` — kollar DB, env-vars, returnerar 200/503
- **Error proxy:** `POST /api/report-error` — frontend kan rapportera fel utan att exponera API-nycklar
- **ErrorBoundary:** React error boundary i `Providers.tsx`, rapporterar till Sentry + CrashCatcher
- **apiErrorHandler.ts:** `withErrorReporting` wrapper för API-routes
- **Status:** CrashCatcher på is — Sentry används istället

### 8. Sentry felmonitorering (live)
- **SDK:** `@sentry/nextjs` v10 — klient + server
- **Konfigfiler:** `sentry.client.config.ts`, `sentry.server.config.ts`
- **Instrumentation:** `src/instrumentation.ts` — laddar Sentry server-side, fångar request errors
- **User context:** `SentryUserSync` komponent synkar session (user.id, email) till Sentry
- **API context:** `reportApiError()` tar `ErrorContext` med userId, orderId, designId som tags
- **Global error:** `global-error.tsx` rapporterar till Sentry
- **Vercel env:** `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT` konfigurerade
- **Edge fix:** Middleware borttagen (översteg 1MB edge-gräns), admin-auth flyttad till server-side layout

### 9. Admin-auth via server-side layout
- **Middleware borttagen:** `src/middleware.ts` importerade hela next-auth (>1MB edge function)
- **Ersatt med:** `src/app/admin/layout.tsx` — kontrollerar `auth()` server-side, redirect vid ej ADMIN

### 10. Boris-knappar synlighet
- **Floating (desktop):** Visar "Fråga Boris"-text på `lg:`, amber glow-skugga
- **Inline:** Starkare bakgrund (`amber-100`), mörkare text (`amber-900`), tydligare kant, permanent skugga

### 11. Remix-flöde mellan kreativa verktyg
- **RemixMenu:** "Remix in..." dropdown — auto-save till DB + JPEG 80% 1024px mellanlager
- **useSourceImage hook:** Läser ?sourceImage + ?remixDesignId + ?remixFrom, canvasReady-flagga
- **RemixBanner:** Visar "Remixed from X" + "View saved version" länk
- **Alla 4 verktyg wrappade i `<Suspense>`** (krävs av useSearchParams)
- **Filer:** `src/components/wallcraft/RemixMenu.tsx`, `src/hooks/useSourceImage.ts`

### 12. Högupplöst export (6000×6000px)
- **hiResExport.ts:** RENDER_SCALE=4, HIRES_EXPORT_SIZE=6000, upscaleCanvas(), exportHiResPng()
- **Mandala + Abstract:** Intern canvas = displaySize × 4, upscalas till 6000px vid export
- **Pattern:** Tile upscalas, repeteras till 6000×6000px
- **Color Field:** Programmatisk re-rendering i 6000×6000px
- **Alla exporterar JPEG 95%** (~2-5 MB istället för 20-50 MB PNG)
- **Upload-gräns höjd till 25 MB** i /api/rooms/upload
- **Fil:** `src/lib/wallcraft/hiResExport.ts`

### 13. AI Gallery-integration
- **Design.isAiGenerated** Boolean @default(false) — markerar AI-genererade designs
- **generatePreview.ts:** Sätter isAiGenerated: true vid AI-generering
- **PATCH /api/designs/[id]:** Stödjer isAiGenerated fält
- **Stripe webhook:** Auto-publicerar AI-designs till Gallery efter betalning (isPublic: true)
- **Gallery list API:** Stödjer `?aiOnly=true` filter, returnerar isAiGenerated
- **Gallery UI:** "✨ AI Art" filter-tab + lila "AI Generated" badge på kort
- **Demo gallery:** Alla demo-items har isAiGenerated: true

### 14. Legal copy — 4-nivå AI-villkor
- **Nivå 1 — Registrering** (`/auth/register`): Checkbox "Jag godkänner användarvillkoren" + länk till /terms. Submit disabled tills ikryssad.
- **Nivå 2 — Studio** (`/wallcraft/studio`, steg 3): Notice under generate-knappen: "AI-genererade motiv skapas i ArtBoris studio och säljs som tryck för privat bruk. ArtBoris kan visa dessa motiv i sitt galleri."
- **Nivå 3 — Gallery** (`/wallcraft/gallery`): Diskret text: "AI-verk skapade i studion kan visas i ArtBoris Gallery."
- **Nivå 4 — Checkout** (`/wallcraft/checkout`): "AI-motiv säljs som tryck för privat bruk enligt våra villkor." (länk till /terms)
- **Extra — Studio:** "Genom att generera ett motiv godkänner du våra villkor." (länk till /terms)
- **i18n:** `legal.*`-nycklar i en.json + sv.json

### 15. Terms-sida (`/terms`)
- Fullständig villkorssida med 8 sektioner (SV+EN med språkväxlare)
- Sektion 4 (lila highlight): AI-genererade motiv — juridiskt bindande text
- Täcker: allmänt, konto, köp/leverans, AI-motiv, användargenererat innehåll, integritet, ansvarsbegränsning, kontakt

### 16. termsAcceptedAt + termsVersion
- **User-modellen:** `termsAcceptedAt DateTime?`, `termsVersion String?`
- **Register API:** Validerar acceptedTerms, sparar termsAcceptedAt + termsVersion ('2026-02')
- **Register UI:** Skickar acceptedTerms i POST body

### 17. Hero-bild på landningssidan
- CSS-baserad rumsscen med väggkonst, soffa, lampa
- Rotation borttagen efter feedback

### 18. GlobalNav login-knapp
- "Logga in / Konto"-knapp i GlobalNav

### 19. AI-förbättring av konstverksbilder vid uppladdning
- Senaste commit: AI-baserad bildförbättring vid artwork upload

### 20. i18n utbyggt till 5 språk
- **Nya språk:** Tyska (DE), Franska (FR), Nederländska (NL) — utöver befintliga Engelska (EN) + Svenska (SV)
- **Nya filer:** `src/i18n/de.json`, `src/i18n/fr.json`, `src/i18n/nl.json`
- **Uppdaterade:** `src/lib/i18n/index.ts` (Locale-typ + dictionaries), `src/components/ui/LanguageSwitcher.tsx` (5 knappar)
- **Terms-sida:** `/terms` har nu alla 8 sektioner på 5 språk med SV/EN/DE/FR/NL toggle
- **Skalbart:** Nytt språk = 1 JSON-fil + 3 rader kod

### 21. Boris Master Prompt — Fine Art AI Portrait System
- **3 nya Boris-stilar:** `boris-silence` (poetisk, mjukt ljus, beige/ivory, nordisk stillhet), `boris-between` (transformation, dimma, kontrast warm/cool), `boris-awakening` (dramatiskt gyllene sidoljus, svart bakgrund)
- **Master prompt-bas:** Delas av alla tre — `androgynous portrait, timeless face, calm presence, fine art photography, soft sculptural light, ultra high detail skin, medium format look, gallery quality, museum print...`
- **Negative prompt-stöd:** Nytt fält `negativePrompt` i `StyleDefinition` — blockerar leenden, tänder, busy backgrounds, fashion makeup etc.
- **Flux-dev för Boris:** Boris-stilar använder `flux-dev` (bättre kvalitet, stöder negative prompt) istället för `flux-schnell`. Vanliga 18 stilar kvar på schnell.
- **Print-modifiers:** Nytt fält `printModifier` — Hahnemühle-textur, matte yta, filmkorn. Läggs till vid slutrender (`buildFinalRenderPrompt`).
- **Variation hints:** Nytt fält `variationHints` — `["double exposure feeling", "light passing through skin", "ethereal atmosphere"]`. Slumpmässigt tillagt vid shuffle/refine.
- **Boris Collection UI:** Egen sektion med guldkant/amber-styling i StylePicker, ovanför de vanliga 18 stilarna med "Fine Art" badge.
- **Bakåtkompatibelt:** Alla nya fält optional, befintliga stilar opåverkade.
- **Filer:** `types/design.ts`, `lib/prompts/styles.ts`, `lib/prompts/templates.ts`, `server/services/ai/generatePreview.ts`, `server/services/ai/refinePreview.ts`, `components/poster/StylePicker.tsx`

### 22. i18n — internationalisera alla kundnära komponenter
- **Commit:** `d8c8b01`
- **useTranslation safe fallback:** `useTranslation()` kastar inte längre utan I18nProvider — returnerar fallback med localStorage-locale
- **5 nya i18n-sektioner** i alla 5 språkfiler (en/sv/de/fr/nl):
  - `boris.*` — 17 nycklar (chat UI, felmeddelanden, action-texter, artChat)
  - `market.*` — 20 nycklar (detaljsida, checkout, "prova på vägg")
  - `artist.*` — 30 nycklar (portal, login, register, dashboard, upload, Stripe)
  - `posterLab.*` — 10 nycklar (result, design, navigation)
  - `order.*` — 3 nycklar (sending, confirmation, sent)
- **Komponenter uppdaterade med `t()`:**
  - `BorisButton.tsx`, `BorisArtChat.tsx`
  - `poster-lab/result/page.tsx`, `poster-lab/design/[id]/page.tsx`, `PosterLabClient.tsx`
  - `market/[id]/ListingClient.tsx`, `market/artist/page.tsx`
  - `order/success/page.tsx`
- **STATUS_LABELS refaktorerad:** → `STATUS_COLORS` + `STATUS_KEYS` för dynamisk i18n i artist-dashboard

### 23. Demo-rum förbättrat — inzoomat, större tavla, skippa väggmarkering
- **Commit:** `eaa2d4f`
- **SVG redesignad:** `room-sample.svg` viewBox zoomad in (`150 60 900 480`) — väggen tar ~85% av bilden
  - Tillagda detaljer: väggtextur, taklist, soffben, pläd, frodigare växt, lampglöd
  - Borttaget: golv/matta/tak-utrymme
- **Tavlan ~25% större:** `ASSUMED_WALL_WIDTH_CM` sänkt 200→160 i `transform.ts`
- **DEMO_WALL_CORNERS:** Fördefinierade vägg-hörn i `lib/demo/demoImages.ts`
- **Skippar väggmarkering:** Alla 4 demo-rum-flöden sätter corners automatiskt:
  - poster-lab → hoppar till pick-style
  - wallcraft/studio → hoppar till pick-style
  - wallcraft/print-your-own → pre-fyller corners
  - market/[id] → hoppar direkt till preview

### 24. Prompt Safety — false positive fix
- **Commit:** `7db2959`
- **BLOCKED_TERMS → BLOCKED_PATTERNS:** Bytte från `includes()` till regex med `\b` word boundaries
- **Fixar:** "what" matchade inte längre "hat", "skilled" matchade inte "kill" etc.
- **sanitizePrompt:** Uppdaterad att använda BLOCKED_PATTERNS
- **Fil:** `src/lib/prompts/safety.ts`

### 25. Boris AI quick-generate knappar
- **Commit:** `7db2959` (wallcraft) + `5525049` (poster-lab)
- **Wallcraft:** "Boris skapar åt dig"-knapp i Creative Tools-sektionen — slumpar stil, genererar 4 varianter, navigerar till resultat
- **Poster Lab:** Boris-knapp under "Se den på min vägg" i hero — visar kostnad (5 credits) + signup-prompt (20 gratis credits)
- **Filer:** `WallcraftClient.tsx`, `PosterLabClient.tsx`

### 26. Internationalisering av startsidan
- **Commit:** `9d188fa`
- **LanguageSwitcher** tillagd i nav (desktop + mobil) på `/` (page.tsx)
- **~50 hårdkodade svenska strängar** ersatta med `t()`-anrop
- **`home.*` i18n-nycklar** i alla 5 språkfiler (en/sv/de/fr/nl)
- **Sektioner:** nav, hero, trust strip, steg, funktioner, Boris-showcase, väggförhandsvisning, konstnärs-CTA, registrering, footer
- **Refaktor:** FEATURES/STEPS → FEATURE_META + FEATURE_ICONS för att kunna använda `t()` inuti komponenten
- **Filer:** `src/app/page.tsx`, `src/i18n/{en,sv,de,fr,nl}.json`

### 27. Akrylglas + Passepartout tillval i checkout
- **Commit:** `1c73c82`
- **Prisma:** `acrylicGlass Boolean @default(false)` tillagd i `OrderItem`
- **Addon-priser per storlek:** Akrylglas 149–349 kr, Passepartout 79–149 kr
- **prints.ts:** `ACRYLIC_PRICES_SEK`, `MAT_PRICES_SEK`, `getAddonPrice()` — storleksbaserade priser
- **calculatePrintPrice + calculateServerPrice:** Utökade med `options?: { matEnabled, acrylicGlass }`
- **CartItem:** Nya fält `matEnabled`, `acrylicGlass`, `matPriceSEK`, `acrylicPriceSEK`
- **CartContext:** `updateItemAddons()` för live-toggle i checkout
- **Checkout UI:** Toggle-knappar med pris + beskrivning per item, kundsupport-block med e-postlänk
- **Ordersammanfattning:** Visar valda tillval ("Akrylglas + Passepartout")
- **API checkout:** Skickar `matEnabled` + `acrylicGlass` till server, sparar i OrderItem
- **Server-side prisvalidering:** Inkluderar tillval i beräkningen
- **Kombinerbart:** Båda tillval kan väljas samtidigt
- **Filer:** `prisma/schema.prisma`, `src/lib/pricing/prints.ts`, `src/lib/cart/CartContext.tsx`, `src/app/api/checkout/route.ts`, `src/app/wallcraft/checkout/page.tsx`, `src/app/wallcraft/design/[id]/page.tsx`

## Kända issues / TODO
- Market checkout saknar orderbekräftelse-mejlval (bara Wallcraft + Poster Lab har det)
- Crimson-priser (costSEK) behöver fyllas i efter avtal med Crimson
- Frame-assets är PNG-placeholders, behöver riktiga rambilder

## Git-historik (senaste 20)
```
1c73c82 feat: akrylglas + passepartout tillval i checkout
9d188fa feat: internationalize landing page with LanguageSwitcher
5525049 feat: Boris AI quick-generate button in Poster Lab hero
7db2959 fix: safety check false positives + Boris quick-generate button
63397be docs: uppdatera SESSION_SUMMARY med i18n-komponenter + demo-rum förbättringar
eaa2d4f demo room: zoom in closer to sofa/wall, pre-defined wall corners, larger poster
d8c8b01 i18n: internationalize all customer-facing components (boris, market, artist, posterLab, order)
fbc1c3b feat: lägg till nederländska (NL) som femte språk
7893db3 feat: lägg till franska (FR) som fjärde språk
29855d8 feat: lägg till tyska (DE) som tredje språk
d7caff0 docs: uppdatera SESSION_SUMMARY + HANDOVER
b54a706 feat: AI-förbättring av konstverksbilder vid uppladdning
1d2392e feat: lägg till logga in/konto-knapp i GlobalNav
711770e fix: ta bort rotation på hero-illustrationen
9ce7267 feat: hero-bild med CSS-baserad rumsscen på landningssidan
32e7db6 docs: uppdatera SESSION_SUMMARY och HANDOVER med senaste funktioner
f661c71 fix: gör Boris-knappar mer synliga på desktop
f0bd3ba feat: Sentry user context — user.id, email, orderId, designId på varje fel
acaf2d1 fix: flytta admin-auth från middleware till server-side layout
b663d12 Add termsAcceptedAt + termsVersion to User model, validate on register
69c956e Legal copy: 4-nivå AI-villkor + /terms sida + i18n + Sentry setup
37487e8 feat: CrashCatcher + Supertestaren-integration
7847206 feat: AI fallback + admin-notifikation
62cd8a3 feat: gör "Mina Tavlor" user-scoped via getUserId()
2df26fa docs: uppdatera README, SESSION_SUMMARY och HANDOVER
36980a6 fix: bättre touch-hantering i MockupPreview för mobil
d1b191a feat: admin-prispanel — DB-driven priskonfiguration
a274aca feat: 4 Crimson-förbättringar — retry, admin resend, webhook, market-ordrar
abd6905 feat: automatisk tryckorder till Crimson via e-post vid betalad order
3f8d401 feat: orderbekräftelse e-postval på success-sidan
a2b7fa0 feat: orderbekräftelse e-postval i checkout + auth, admin, SEO
```
