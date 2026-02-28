# Handover — Artboris

**GitHub:** https://github.com/Mats6102hamberg/artboris
**Vercel:** https://artboris.vercel.app/
**Local path:** `/Users/matshamberg/CascadeProjects/Artboris`
**Last updated:** 2026-02-28

---

## Project Overview

Artboris is a Next.js 16 app with multiple products:

1. **Wallcraft** (main product) — Create unique art for your walls. Includes 5 interactive creative tools with remix flow between them, AI-powered design studio, Photo Transform (AI img2img), Print Your Own (upload photo), room mockup preview, hi-res export (6000×6000px), AI Gallery with auto-publish, and print ordering via Stripe.
2. **Art Market** — Marketplace for artists/photographers. Invite-only registration, AI review, Stripe Connect 50/50 payouts.
3. **Art Scanner** — Scans auction houses for undervalued artworks with GPT-4 valuation.
4. **BorisArt AI** — GPT-4 chatbot for art questions.
5. **My Artworks** — Personal art collection manager.

---

## Getting Started

```bash
cd /Users/matshamberg/CascadeProjects/Artboris
npm install
npm run dev
```

Works in **demo mode** without any API keys. Open http://localhost:3000.

**For full features:**
```bash
# Create .env.local with:
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
STRIPE_WEBHOOK_SECRET=whsec_...
BLOB_READ_WRITE_TOKEN=vercel_blob_...
REPLICATE_API_TOKEN=r8_...
RESEND_API_KEY=re_...
CRIMSON_ORDER_EMAIL=order@crimson.se
CRIMSON_WEBHOOK_SECRET=secret_...
NEXT_PUBLIC_SENTRY_DSN=https://xxx@yyy.ingest.sentry.io/zzz
SENTRY_ORG=artboris
SENTRY_PROJECT=javascript-nextjs
ADMIN_ALERT_EMAIL=mhg10mhg@gmail.com
ADMIN_SECRET=boris-admin-2024

# Run migrations
npx prisma migrate dev
```

**Stripe CLI (installed):**
```bash
stripe login                    # Already authenticated
stripe listen --forward-to localhost:3000/api/webhook/stripe
```

---

## Wallcraft Architecture

### Routes

| Route | Page | Description |
|-------|------|-------------|
| `/wallcraft` | Landing | Hero, creative tools grid, featured designs, CTA, footer |
| `/wallcraft/studio` | Design Studio | Upload room → mark wall → pick style → AI generates 4 variants |
| `/wallcraft/result` | Results | Variant selection (redirects to design editor) |
| `/wallcraft/design/[id]` | Design Editor | Position on wall, pick frame & size, publish toggle, auto-saves state |
| `/wallcraft/gallery` | Gallery | Public inspiration gallery with filter (incl. "✨ AI Art"), sort, likes, AI badge, legal notice + "Sell your art" CTA |
| `/terms` | Terms of Service | Full terms page with 8 sections (SV+EN toggle), AI-generated designs section highlighted |
| `/wallcraft/create` | Create AI Art | Two modes: standalone AI generation with style picker, or img2img from existing motif (promptStrength slider) |
| `/wallcraft/credits` | Buy Credits | Credit packages (100/300/1000), balance display, Stripe checkout |
| `/wallcraft/checkout` | Checkout | Stripe checkout flow (Apple Pay, Klarna, cards) |
| `/wallcraft/mandala` | Mandala Maker | Radial symmetry drawing tool (4–16 fold) |
| `/wallcraft/pattern` | Pattern Studio | Seamless tile pattern creator with live repeat preview |
| `/wallcraft/abstract` | Abstract Painter | Generative flow-field particle painting |
| `/wallcraft/colorfield` | Color Field Studio | Minimalist color field compositions (Rothko/Albers) |
| `/wallcraft/photo-transform` | Photo Transform | Upload photo → pick style + strength → AI (Flux Dev img2img) generates 4 variants → editor |
| `/wallcraft/print-your-own` | Print Your Own | Upload own photo → DPI analysis → room upload → wall mark → editor |
| `/market` | Art Market | Public gallery of artist listings |
| `/market/[id]` | Listing Detail | Preview → checkout with shipping form + Stripe Connect |
| `/market/artist` | Artist Portal | Register (invite code), upload, manage listings, Stripe Connect |
| `/admin/invites` | Invite Admin | Create and manage invite codes |
| `/admin/pricing` | Pricing Admin | Edit sizes, frames, papers, shipping, VAT with margin calculation |
| `/boris` | Boris M Dashboard | Admin dashboard with 6 tabs: Funnel, Events, Trends, Insights, Memory, Report. Auth via ADMIN_SECRET. |
| `/order/success` | Order Success | Confetti + send order confirmation to chosen email |

### User Flow: Create → Publish → Sell

```
WallCraft Studio / Creative Tools
  → AI generates design variants (isAiGenerated: true)
  → Design Editor: pick frame, size, position on wall
  → Toggle "Dela i galleriet" → publishes to /wallcraft/gallery (live API call)
  → CTA: "Vill du sälja? Bli konstnär →" → /market/artist
  → "Add to cart" → /wallcraft/checkout → Stripe
  → Stripe webhook: AI-generated designs auto-published to Gallery (isPublic: true)

Art Market (separate gated flow):
  → Register with invite code → Stripe Connect onboarding
  → Upload artwork → Sharp optimization → AI review
  → Listed in /market when approved
```

### Creative Tools — Shared Architecture

All 5 creative tools follow the same pattern (4 canvas tools + Photo Transform):

```
Canvas drawing/generation → Refine (local processing) → Compare (before/after slider)
  → "Use as Wall Art" (hi-res 6000×6000px JPEG 95% → upload to Blob → create Design → open editor)
  → "Download PNG" (direct export)
  → "Remix in..." (auto-save → JPEG 80% 1024px → open another tool with sourceImage)
```

**Remix flow:** Any creative tool can send its result to another tool as a starting image.
- `RemixMenu` component: dropdown with all tools, auto-saves current work to DB
- `useSourceImage` hook: reads `?sourceImage` + `?remixDesignId` + `?remixFrom` params
- `RemixBanner`: shows "Remixed from X" with link to saved version
- All 4 canvas tools wrapped in `<Suspense>` (required by useSearchParams)

**Hi-res export (6000×6000px):**
- `src/lib/wallcraft/hiResExport.ts`: RENDER_SCALE=4, upscaleCanvas(), exportHiResPng()
- Mandala + Abstract: internal canvas = displaySize × 4, upscaled to 6000px at export
- Pattern: tile upscaled, repeated to 6000×6000px
- Color Field: fully programmatic re-render at 6000×6000px
- All export as JPEG 95% (~2-5 MB vs 20-50 MB PNG)
- Upload limit raised to 25 MB in /api/rooms/upload

**Key shared module:** `src/lib/mandala/refineArtwork.ts`
- Local canvas image processing (no external services)
- Smoothing (box blur), contrast (S-curve), vibrance boost, radial depth glow
- Configurable via `RefineSettings` interface
- Used by all canvas-based creative tools

**Photo Transform** uses a different pipeline:
```
Upload photo → Pick style (21 styles: 3 Boris + 18 regular) + transformation strength (0.2–0.95)
  → Flux Dev img2img (4 parallel variants, prompt_strength controls transformation)
  → Design Editor → publish / sell / print
```
- Strength presets: Subtle (0.35), Balanced (0.55), Creative (0.75), Reimagine (0.90)
- Uses `flux-dev` for img2img (image input) and Boris styles (negative prompt + higher quality)
- Uses `flux-schnell` for regular txt2img styles (faster/cheaper)

### Navigation

- **Desktop:** "Tools" dropdown in navbar → links to all 5 creative tools + Print Your Own
- **Mobile:** Hamburger menu with "Creative Tools" section
- **Landing page:** Creative Tools section with 6 cards (5 tools + Design Studio)

### Backend Services

| Service | File | Description |
|---------|------|-------------|
| generatePreview | `server/services/ai/generatePreview.ts` | Replicate Flux Schnell (regular styles) or Flux Dev (Boris styles + img2img), 4 parallel variants, negative prompt support. Demo mode returns local SVGs. |
| refinePreview | `server/services/ai/refinePreview.ts` | New variant based on user feedback |
| generateFinalPrint | `server/services/ai/generateFinalPrint.ts` | HD render for printing |
| composeMockup | `server/services/mockup/composeMockup.ts` | CSS-based wall placement |
| canSpend / spend | `server/services/credits/` | Credit check and transactions |
| publishToGallery | `server/services/gallery/publish.ts` | Toggles `isPublic` on existing Design (update, not create) |
| listGallery / like | `server/services/gallery/` | Gallery listing (supports `aiOnly` filter + `isAiGenerated` field) + anonymous likes |
| createOrder | `server/services/orders/createOrder.ts` | Order + credit deduction in transaction |
| generatePrintAsset | `server/services/print/generatePrintAsset.ts` | Sharp-based print file generation |
| sendEmail | `server/services/email/sendEmail.ts` | Order confirmation + Crimson order emails, retry with backoff |
| withAIRetry | `server/services/ai/withAIRetry.ts` | Retry with exponential backoff + cross-provider fallback (Replicate ↔ DALL-E 3) |
| adminAlert | `server/services/email/adminAlert.ts` | Admin email alerts via Resend with 5-min debounce |
| reportApiError | `lib/crashcatcher.ts` | Reports to Sentry (primary) + CrashCatcher (optional), with user/order context |
| reportError | `lib/crashcatcher.ts` | HTTP client for CrashCatcher API with debounce |

### Key Components

| Component | File | Purpose |
|-----------|------|---------|
| Button | `components/ui/Button.tsx` | Variants: primary/secondary/ghost/outline, sizes: sm/md/lg |
| Card | `components/ui/Card.tsx` | Variants: default/elevated/bordered |
| LanguageSwitcher | `components/ui/LanguageSwitcher.tsx` | EN/SV toggle |
| RoomUpload | `components/poster/RoomUpload.tsx` | Drag-drop image upload (Vercel Blob) |
| PrintYourOwn | `components/poster/PrintYourOwn.tsx` | Photo upload + DPI quality analysis |
| WallMarker | `components/poster/WallMarker.tsx` | Click 4 corners, drag to adjust |
| StylePicker | `components/poster/StylePicker.tsx` | 21 styles (3 Boris Collection + 18 regular) with color preview |
| MockupPreview | `components/poster/MockupPreview.tsx` | CSS-based wall placement, drag/pinch/resize, +/- scale buttons, mobile-optimized touch |
| PublishToggle | `components/poster/PublishToggle.tsx` | Gallery publish toggle (calls API on toggle) |
| CreditBadge | `components/poster/CreditBadge.tsx` | Credit balance display, clicks → /wallcraft/credits |
| AddonsPanel | `components/poster/AddonsPanel.tsx` | Passepartout, acrylic glass, screws & screwdriver addons with per-size pricing |
| ErrorBoundary | `components/ErrorBoundary.tsx` | React error boundary → Sentry + CrashCatcher |
| SentryUserSync | `components/SentryUserSync.tsx` | Syncs session user.id/email to Sentry context |
| BorisButton | `components/boris/BorisButton.tsx` | Floating FAB or inline chat button for Boris AI |
| BorisChatPanel | `components/boris/BorisChatPanel.tsx` | Floating 🔧 button + chat modal for Boris M conversational AI (admin only, polls localStorage for admin_secret) |
| BorisVoice | `components/boris/BorisVoice.tsx` | Typewriter speech bubble from Boris |
| WallSwitcher | `components/poster/WallSwitcher.tsx` | Horizontal scrollable demo wall thumbnails, blue ring selection, custom wall button |
| RemixMenu | `components/wallcraft/RemixMenu.tsx` | "Remix in..." dropdown, auto-save to DB, JPEG 80% 1024px |
| RemixBanner | `components/wallcraft/RemixMenu.tsx` | "Remixed from X" banner with link to saved version |

### i18n System

- **5 språk:** EN, SV, DE, FR, NL
- Dictionaries: `src/i18n/en.json`, `sv.json`, `de.json`, `fr.json`, `nl.json`
- Provider: `src/lib/i18n/context.tsx` → `I18nProvider` + `useTranslation()` hook
- Locale stored in `localStorage('wallcraft-locale')`
- LanguageSwitcher: 5 knappar (EN/SV/DE/FR/NL)
- Terms-sida (`/terms`): egen språkväxlare med alla 5 språk
- **Legal keys:** `legal.studioNotice`, `legal.studioConsent`, `legal.galleryNotice`, `legal.checkoutNotice`, `legal.termsCheckbox`
- **Skalbart:** Nytt språk = 1 JSON-fil + 3 rader kod (import, Locale-typ, SUPPORTED_LOCALES)

### Database Models (Prisma)

**User:**
- `User` — id, name, email, passwordHash, role, anonId, artistProfileId, `termsAcceptedAt`, `termsVersion`

**Design & Gallery:**
- `Design` — style, roomType, colorMood, likesCount, isPublic, `isAiGenerated`, position/scale/frame/size state
- `DesignVariant` — individual generated variants
- `DesignAsset` — print files (roles: PREVIEW/PRINT/THUMB) with DPI, size, URL
- `Like` — anonymous likes with anonId, `@@unique([designId, anonId])`
- `RoomMeta` — wall color, light type, mood (1:1 to Design)

**Credits:**
- `CreditAccount` — balance per user (anonId)
- `CreditTransaction` — purchase/spend history

**Orders:**
- `Order` — main order with status enum, prices in cents (SEK)
- `OrderItem` — product type (POSTER/CANVAS/METAL/FRAMED_POSTER), size, frame, paper
- `Payment` — Stripe integration (checkout session, payment intent)
- `ShippingAddress` — full address with ISO country code + `confirmationEmail` (nullable)
- `Fulfillment` — print status per item: partner, tracking, timestamps, SENT_TO_PARTNER status
- `PrintPartner` — seeded: Crimson (crimson.se, Stockholm)

**Pricing:**
- `PricingConfig` — single row (id: "current"), JSON fields for sizes/frames/papers, shippingSEK, marketShippingSEK, vatRate

**Art Market:**
- `ArtistProfile` — email, displayName, Stripe Connect, invite-gated
- `ArtworkListing` — full listing with Sharp-processed images, AI review, pricing
- `MarketOrder` — separate order system with 50/50 split
- `InviteCode` — artist/photographer invite codes

### Print Pipeline

```
Design editor → PATCH auto-save (position, scale, crop, frame, size)
  → Order created → Stripe checkout → Webhook confirms payment
  → GENERATE_PRINT_FINAL triggered (non-blocking)
  → renderFinalPrint.ts: fetch design + crop from DB → Sharp processing → Blob upload → DesignAsset
  → Admin UI: shows READY/MISSING for PRINT_FINAL with download link
```

### Checkout Pipeline

```
/api/checkout (POST):
  1. parse-body — validate items, shipping
  2. validate-data — check enums (productType, frameColor, paperType) + verify designIds exist in DB
  3. validate-stripe — ensure STRIPE_SECRET_KEY is set
  4. calculate-totals — SERVER-SIDE pricing via getPricingConfig() + calculateServerPrice()
     → overrides client-sent unitPriceCents (security: client can't manipulate price)
     → logs warning if client price diverges > 1 kr
     → shipping + VAT from DB config (not hardcoded)
  5. create-order — Prisma order with items, shipping, payment
  6. create-stripe-session — Stripe Checkout with line items
  7. update-payment — save Stripe session ID
  On error: rollback order to CANCELED if Stripe fails after DB write
```

### Crimson Print Partner Pipeline

```
Stripe webhook (checkout.session.completed)
  → processCheckoutCompleted() creates Fulfillment records
  → sendCrimsonOrderEmail(orderId) — non-blocking
    → Fetches order + items + shipping + print file URLs
    → Renders CrimsonOrderNotification email template
    → Sends via Resend with retry (3 attempts, exponential backoff)
    → Marks fulfillments as SENT_TO_PARTNER

Crimson webhook (POST /api/webhook/crimson):
  → Validates x-crimson-secret header
  → Events: order.received, order.in_production, order.shipped
  → Updates Fulfillment status + tracking info
  → Sends shipped email to customer on order.shipped
```

### Pricing System

```
Admin: /admin/pricing → PATCH /api/admin/pricing → PricingConfig (DB)
  → Sizes: baseSEK, costSEK per size (a5, a4, a3, 30x40, 40x50, 50x70, 61x91, 70x100)
  → Frames: priceSEK, costSEK per frame (none, black, white, oak, walnut, gold)
  → Papers: priceSEK, costSEK per paper (DEFAULT, MATTE, SEMI_GLOSS, FINE_ART)
  → Shipping: shippingSEK, marketShippingSEK, vatRate
  → invalidatePricingCache() clears in-memory cache

Server-side: getPricingConfig() → DB with 5 min in-memory cache → fallback to hardcoded
Client-side: calculatePrintPrice() → synchronous with hardcoded fallback (no DB)
Public API: GET /api/pricing → strips costSEK, Cache-Control 5 min
```

### Error Monitoring & Alerting

```
Error occurs (client or server)
  ├─ Sentry (primary) — real-time error tracking with user context
  │   ├─ Client: sentry.client.config.ts (browser tracing, session replay)
  │   ├─ Server: sentry.server.config.ts (via instrumentation.ts)
  │   ├─ User context: SentryUserSync syncs user.id + email from session
  │   └─ API context: reportApiError() adds userId, orderId, designId as tags
  │
  ├─ Admin email alerts (Resend) — immediate notification to mhg10mhg@gmail.com
  │   ├─ sendAIAdminAlert() — when AI services fail/fallback
  │   ├─ sendErrorAdminAlert() — when critical API routes error
  │   └─ 5-min debounce per service key (prevents flood)
  │
  ├─ AI Fallback (invisible to user)
  │   ├─ withAIRetry() — exponential backoff retry with error classification
  │   ├─ generatePreview: Replicate Flux → DALL-E 3 fallback
  │   ├─ refinePreview: DALL-E 3 → Replicate Flux fallback
  │   └─ generateFinalPrint, upscale: retry only (no cross-provider fallback)
  │
  └─ CrashCatcher (prepared, not active)
      ├─ reportError() fires to CRASHCATCHER_API_URL if set
      ├─ /api/health — DB + env check for external monitors
      └─ /api/report-error — client-side error proxy
```

**Admin auth:** Server-side layout (`src/app/admin/layout.tsx`) checks `auth()` and redirects.
No edge middleware (removed due to Vercel 1MB edge function limit with next-auth).

- **Boris M admin:** `/boris` — currently **open access** (auth temporarily removed). All 7 API routes + dashboard + chat panel work without authentication.
- **Auth restoration:** All removed auth code saved in memory (ID: af5c9532) for easy re-enablement.
- **Secret entrance:** 5 rapid clicks on "by Artboris" text in header → navigates to `/boris`
- **Chat API:** `POST /api/boris/chat` — gathers live data (sales, funnel, errors, incidents, insights) + sends to GPT via `borisChat()`
- **Chat UI:** `BorisChatPanel` in root layout — floating 🔧 button, always visible (no auth gate)
- **Dashboard:** 6 tabs (Funnel, Events, Trends, Insights, Memory, Report) + 6 API endpoints under `/api/boris/*`
- **Env var:** `ADMIN_SECRET` (currently `boris-admin-2024`, not enforced)

### Brand Style

- Background: `#FAFAF8` (warm off-white)
- Scandinavian modern, minimal, warm neutral tones
- Font: light weight headings, medium body
- `rounded-2xl` cards, `rounded-xl` buttons
- No clutter, no neon

---

## Known Limitations & TODO

### Fixed Bugs
- [x] **Checkout** — `STRIPE_SECRET_KEY` missing, no validation, orphaned orders. Fixed with key guard, designId check, enum validation, rollback.
- [x] **Cart size display** — showed 277×396 cm instead of 70×100 cm (preview scale multiplied with physical size). Fixed.
- [x] **PublishToggle dead code** — toggle in editor never called API. Fixed: now calls `/api/gallery/publish` directly.
- [x] **publishToGallery duplicates** — created new Design instead of toggling `isPublic`. Fixed: now uses `updateMany`.
- [x] **MyArtworks status** — `'available'` vs `'tillgänglig'` mismatch. Fixed: aligned to Swedish.
- [x] **Vercel env vars** — `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` added.
- [x] **Photo Transform** — New creative tool: upload photo → pick style + strength → AI (Flux Dev img2img) generates 4 variants. Added to landing page + navigation.
- [x] **Vitest test suite** — 37 tests covering 5 API routes + generatePreview service. All green.
- [x] **Order confirmation email choice** — Customer chooses email recipient at checkout + success page.
- [x] **Crimson print partner** — Auto-send orders via email, retry mechanism, admin resend, webhook, market orders.
- [x] **Admin pricing panel** — DB-driven pricing config with admin UI, server-side price validation in checkout.
- [x] **Mobile mockup touch** — Bigger resize handles (48px), visible corners, +/- buttons, pinch hint.
- [x] **AI Fallback** — withAIRetry with cross-provider failover (Replicate ↔ DALL-E 3), admin email alerts.
- [x] **Sentry integration** — Client + server error monitoring, user context, deployed to Vercel.
- [x] **CrashCatcher prep** — Health endpoint, error proxy, ErrorBoundary (CrashCatcher itself on hold).
- [x] **Admin auth fix** — Middleware removed (>1MB edge limit), replaced with server-side admin layout.
- [x] **Boris buttons visibility** — Floating shows label on desktop + amber glow, inline has stronger contrast.
- [x] **Remix flow** — RemixMenu + useSourceImage hook, auto-save, JPEG 80% 1024px mellanlager.
- [x] **Hi-res export** — 6000×6000px JPEG 95% for all creative tools, upload limit 25 MB.
- [x] **AI Gallery** — isAiGenerated field, auto-publish via webhook, "✨ AI Art" filter, AI badge.
- [x] **Legal copy (4 nivåer)** — Registration checkbox, studio notice, gallery notice, checkout notice.
- [x] **Terms page** — `/terms` with 8 sections, SV+EN toggle, AI section highlighted.
- [x] **termsAcceptedAt** — DateTime + version tracked on User model at registration.
- [x] **Hero image** — CSS-based room scene on landing page.
- [x] **GlobalNav login** — Login/account button in navigation.
- [x] **i18n 5 språk** — EN, SV, DE, FR, NL. LanguageSwitcher + Terms-sida på alla 5 språk.
- [x] **Boris Master Prompt** — 3 Boris fine art portrait styles (Silence/Between/Awakening) med master prompt-bas, negative prompt, flux-dev, print-modifiers, variation hints, Boris Collection UI-sektion.
- [x] **Boris auth removed (temporary)** — All admin auth removed from Boris APIs + dashboard + chat. Saved in memory for easy restoration.
- [x] **AI Art creation** — Prominent "Skapa AI-konst" button in hero, "Skapa ny konst från detta" on gallery items + design page, new `/wallcraft/create` page with img2img support.
- [x] **Credits purchase page** — `/wallcraft/credits` with 3 packages, balance display, nav link, CreditBadge clickable.
- [x] **Design addons** — AddonsPanel: passepartout (79–149 kr), acrylic glass (149–349 kr, requires frame), screws (49 kr), screwdriver (79 kr). Integrated in design editor sidebar + pricing + checkout.
- [x] **Swappable demo walls** — 7 demo walls (vardagsrum, sovrum, kök, kontor, hall, barnrum, matsal) with WallSwitcher component. Poster stays in place when switching walls. Custom wall upload with WallMarker. Boris comments on wall changes. i18n in 5 locales. Config: `src/lib/demo/demoWalls.ts`, SVGs in `public/assets/demo/walls/`.

### For Production
- [x] **Auth** — NextAuth with JWT sessions, Google + Credentials providers, admin role check via layout
- [ ] **CrashCatcher deployment** — Prepared but not deployed (on hold, Sentry covers monitoring needs)
- [ ] **Remaining Swedish** — poster-lab, admin UI, some components still have Swedish strings
- [ ] **Frame assets** — PNG placeholders, need real frame images
- [x] **Tests** — Vitest testsvit med 37 tester (se Test Suite nedan)
- [ ] **Art Scanner portfolio** — saved in React state only, not persisted to DB
- [ ] **Crimson costSEK** — Fill in production costs after Crimson agreement (via /admin/pricing)

### Nice to Have
- [ ] **Demo wall photos** — Replace SVG placeholder rooms with real WebP photos for production quality
- [ ] **Custom wall persistence** — Upload custom wall to Vercel Blob instead of using blob URL
- [ ] **SEO** — Meta tags, OG images for Wallcraft pages
- [ ] **Onboarding** — First-visit tutorial
- [ ] **Gallery seeding** — Pre-populate with example designs
- [ ] **More creative tools** — Typography tool, collage maker, etc.
- [ ] **Social sharing** — Share designs to social media
- [ ] **Connect MyArtworks → Art Market** — "Sell on Market" button that creates ArtworkListing from Artwork

### Gallery / listGallery — förbättringar vid skala
- [ ] **Dynamisk trustScore** — Beräkna baserat på antal köp, reviews, AI-moderation-status, `printQuality` istället för hårdkodat 98/95
- [ ] **Paginering** — Nuvarande approach hämtar `limit` items per källa och mergar. Vid stora volymer → cursor-baserad paginering eller gemensam DB-view
- [ ] **likesCount vs views** — Market-items mappar `views` till `likesCount`. Överväg att byta till `popularity: number` eller lägga till separat `views`-fält i interfacet

---

## Test Suite

**Framework:** Vitest 4.x · **37 tests, 6 test files** · Runs in ~1 second

```bash
npm test          # Watch mode
npm run test:run  # Single run
npm run test:coverage  # With coverage report
```

### Test Files

| File | Tests | What it covers |
|------|-------|----------------|
| `src/__tests__/api/checkout.test.ts` | 10 | Body validation, enum checks (productType/frameColor/paperType), Stripe key guard, designId DB check, happy path, rollback to CANCELED |
| `src/__tests__/api/designs-generate.test.ts` | 7 | Quota 429, style validation, txt2img (no image), img2img (inputImageUrl + promptStrength), error handling, usage increment |
| `src/__tests__/api/gallery-publish.test.ts` | 5 | POST publish, DELETE unpublish, missing designId 400, service error forwarding |
| `src/__tests__/api/my-artworks.test.ts` | 7 | GET all, POST with status 'tillgänglig', PUT update, DELETE, P2025 → 404, DB error → 500 |
| `src/__tests__/api/designs-create-upload.test.ts` | 3 | Missing imageUrl 400, happy path (user-upload style + nested variant), DB error 500 |
| `src/__tests__/services/generatePreview.test.ts` | 5 | Demo mode (no API calls), prompt safety block, flux-schnell for txt2img, flux-dev for img2img, default promptStrength 0.65 |

### Mocking Strategy

All tests mock external dependencies to run without network/DB:
- `@/lib/prisma` — Prisma client (global setup)
- `@/lib/anonId` — `getOrCreateAnonId()` returns `'anon_test_123'` (global setup)
- `stripe` — Class mock with `checkout.sessions.create`
- `replicate` — Class mock with `run()` method
- `@vercel/blob` — `put()` mock
- Services mocked at module level for route tests

### Config

- `vitest.config.ts` — Node environment, `@/` alias resolved via `path.resolve`
- `src/__tests__/setup.ts` — Global mocks for prisma and anonId

---

## Git

| Remote | URL |
|--------|-----|
| `origin` | https://github.com/Mats6102hamberg/artboris.git |

Push: `git push origin main`

---

*Last updated: 2026-02-28 (session 9) · Built with Cascade*
