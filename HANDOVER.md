# Handover — Artboris

**GitHub:** https://github.com/Mats6102hamberg/artboris
**Vercel:** https://artboris.vercel.app/
**Local path:** `/Users/matshamberg/CascadeProjects/Artboris`
**Last updated:** 2026-02-17

---

## Project Overview

Artboris is a Next.js 16 app with multiple products:

1. **Wallcraft** (main product) — Create unique art for your walls. Includes 5 interactive creative tools, AI-powered design studio, Photo Transform (AI img2img), Print Your Own (upload photo), room mockup preview, and print ordering via Stripe.
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
| `/wallcraft/gallery` | Gallery | Public inspiration gallery with filter, sort, likes + "Sell your art" CTA |
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
| `/order/success` | Order Success | Confetti + send order confirmation to chosen email |

### User Flow: Create → Publish → Sell

```
WallCraft Studio / Creative Tools
  → AI generates design variants
  → Design Editor: pick frame, size, position on wall
  → Toggle "Dela i galleriet" → publishes to /wallcraft/gallery (live API call)
  → CTA: "Vill du sälja? Bli konstnär →" → /market/artist
  → "Add to cart" → /wallcraft/checkout → Stripe

Art Market (separate gated flow):
  → Register with invite code → Stripe Connect onboarding
  → Upload artwork → Sharp optimization → AI review
  → Listed in /market when approved
```

### Creative Tools — Shared Architecture

All 5 creative tools follow the same pattern (4 canvas tools + Photo Transform):

```
Canvas drawing/generation → Refine (local processing) → Compare (before/after slider)
  → "Use as Wall Art" (upload to Blob → create Design → open editor)
  → "Download PNG" (direct export)
```

**Key shared module:** `src/lib/mandala/refineArtwork.ts`
- Local canvas image processing (no external services)
- Smoothing (box blur), contrast (S-curve), vibrance boost, radial depth glow
- Configurable via `RefineSettings` interface
- Used by all canvas-based creative tools

**Photo Transform** uses a different pipeline:
```
Upload photo → Pick style (18 styles) + transformation strength (0.2–0.95)
  → Flux Dev img2img (4 parallel variants, prompt_strength controls transformation)
  → Design Editor → publish / sell / print
```
- Strength presets: Subtle (0.35), Balanced (0.55), Creative (0.75), Reimagine (0.90)
- Uses `flux-dev` (not `flux-schnell`) because only Dev supports `image` input

### Navigation

- **Desktop:** "Tools" dropdown in navbar → links to all 5 creative tools + Print Your Own
- **Mobile:** Hamburger menu with "Creative Tools" section
- **Landing page:** Creative Tools section with 6 cards (5 tools + Design Studio)

### Backend Services

| Service | File | Description |
|---------|------|-------------|
| generatePreview | `server/services/ai/generatePreview.ts` | Replicate Flux Schnell (txt2img) or Flux Dev (img2img), 4 parallel variants. Demo mode returns local SVGs. |
| refinePreview | `server/services/ai/refinePreview.ts` | New variant based on user feedback |
| generateFinalPrint | `server/services/ai/generateFinalPrint.ts` | HD render for printing |
| composeMockup | `server/services/mockup/composeMockup.ts` | CSS-based wall placement |
| canSpend / spend | `server/services/credits/` | Credit check and transactions |
| publishToGallery | `server/services/gallery/publish.ts` | Toggles `isPublic` on existing Design (update, not create) |
| listGallery / like | `server/services/gallery/` | Gallery listing + anonymous likes |
| createOrder | `server/services/orders/createOrder.ts` | Order + credit deduction in transaction |
| generatePrintAsset | `server/services/print/generatePrintAsset.ts` | Sharp-based print file generation |
| sendEmail | `server/services/email/sendEmail.ts` | Order confirmation + Crimson order emails, retry with backoff |

### Key Components

| Component | File | Purpose |
|-----------|------|---------|
| Button | `components/ui/Button.tsx` | Variants: primary/secondary/ghost/outline, sizes: sm/md/lg |
| Card | `components/ui/Card.tsx` | Variants: default/elevated/bordered |
| LanguageSwitcher | `components/ui/LanguageSwitcher.tsx` | EN/SV toggle |
| RoomUpload | `components/poster/RoomUpload.tsx` | Drag-drop image upload (Vercel Blob) |
| PrintYourOwn | `components/poster/PrintYourOwn.tsx` | Photo upload + DPI quality analysis |
| WallMarker | `components/poster/WallMarker.tsx` | Click 4 corners, drag to adjust |
| StylePicker | `components/poster/StylePicker.tsx` | 18 styles with color preview |
| MockupPreview | `components/poster/MockupPreview.tsx` | CSS-based wall placement, drag/pinch/resize, +/- scale buttons, mobile-optimized touch |
| PublishToggle | `components/poster/PublishToggle.tsx` | Gallery publish toggle (calls API on toggle) |
| CreditBadge | `components/poster/CreditBadge.tsx` | Credit balance display |

### i18n System

- Dictionaries: `src/i18n/en.json`, `src/i18n/sv.json`
- Provider: `src/lib/i18n/context.tsx` → `I18nProvider` + `useTranslation()` hook
- Locale stored in `localStorage('wallcraft-locale')`
- All Wallcraft pages use English strings (translated from Swedish)

### Database Models (Prisma)

**Design & Gallery:**
- `Design` — style, roomType, colorMood, likesCount, isPublic, position/scale/frame/size state
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

### For Production
- [ ] **Auth** — No real authentication. Uses cookie-based `anonId`
- [ ] **Remaining Swedish** — poster-lab, admin UI, some components still have Swedish strings
- [ ] **Frame assets** — PNG placeholders, need real frame images
- [x] **Tests** — Vitest testsvit med 37 tester (se Test Suite nedan)
- [ ] **Art Scanner portfolio** — saved in React state only, not persisted to DB
- [ ] **Crimson costSEK** — Fill in production costs after Crimson agreement (via /admin/pricing)

### Nice to Have
- [ ] **SEO** — Meta tags, OG images for Wallcraft pages
- [ ] **Onboarding** — First-visit tutorial
- [ ] **Gallery seeding** — Pre-populate with example designs
- [ ] **More creative tools** — Typography tool, collage maker, etc.
- [ ] **Social sharing** — Share designs to social media
- [ ] **Connect MyArtworks → Art Market** — "Sell on Market" button that creates ArtworkListing from Artwork

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

*Last updated: 2026-02-17 · Built with Claude Code*
