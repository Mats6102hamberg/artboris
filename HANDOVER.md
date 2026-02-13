# Handover — Artboris

**GitHub:** https://github.com/Mats6102hamberg/artboris
**Local path:** `/Users/matshamberg/CascadeProjects/Artboris`
**Last updated:** 2026-02-13

---

## Project Overview

Artboris is a Next.js 16 app with multiple products:

1. **Wallcraft** (main product) — Create unique art for your walls. Includes 4 interactive creative tools, AI-powered design studio, room mockup preview, and print ordering via Stripe.
2. **Art Scanner** — Scans auction houses for undervalued artworks with GPT-4 valuation.
3. **BorisArt AI** — GPT-4 chatbot for art questions.
4. **My Artworks** — Personal art collection manager.

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
STRIPE_WEBHOOK_SECRET=whsec_...
BLOB_READ_WRITE_TOKEN=vercel_blob_...
REPLICATE_API_TOKEN=r8_...

# Run migrations
npx prisma migrate dev
```

---

## Wallcraft Architecture

### Routes

| Route | Page | Description |
|-------|------|-------------|
| `/wallcraft` | Landing | Hero, creative tools grid, featured designs, CTA, footer |
| `/wallcraft/studio` | Design Studio | Upload room → mark wall → pick style → AI generates 4 variants |
| `/wallcraft/result` | Results | Variant selection (redirects to design editor) |
| `/wallcraft/design/[id]` | Design Editor | Position on wall, pick frame & size, auto-saves state |
| `/wallcraft/gallery` | Gallery | Public inspiration gallery with filter, sort, likes |
| `/wallcraft/checkout` | Checkout | Stripe checkout flow |
| `/wallcraft/mandala` | Mandala Maker | Radial symmetry drawing tool (4–16 fold) |
| `/wallcraft/pattern` | Pattern Studio | Seamless tile pattern creator with live repeat preview |
| `/wallcraft/abstract` | Abstract Painter | Generative flow-field particle painting |
| `/wallcraft/colorfield` | Color Field Studio | Minimalist color field compositions (Rothko/Albers) |

### Creative Tools — Shared Architecture

All 4 creative tools follow the same pattern:

```
Canvas drawing/generation → Refine (local processing) → Compare (before/after slider)
  → "Use as Wall Art" (upload to Blob → create Design → open editor)
  → "Download PNG" (direct export)
```

**Key shared module:** `src/lib/mandala/refineArtwork.ts`
- Local canvas image processing (no external services)
- Smoothing (box blur), contrast (S-curve), vibrance boost, radial depth glow
- Configurable via `RefineSettings` interface
- Used by all 4 creative tools

### Navigation

- **Desktop:** "Tools" dropdown in navbar → links to all 4 creative tools
- **Mobile:** Hamburger menu with "Creative Tools" section
- **Landing page:** Creative Tools section with 5 cards (4 tools + Design Studio)

### Backend Services

| Service | File | Description |
|---------|------|-------------|
| generatePreview | `server/services/ai/generatePreview.ts` | DALL-E 3, 4 parallel variants. Demo mode returns local SVGs. |
| refinePreview | `server/services/ai/refinePreview.ts` | New variant based on user feedback |
| generateFinalPrint | `server/services/ai/generateFinalPrint.ts` | HD render for printing |
| composeMockup | `server/services/mockup/composeMockup.ts` | CSS-based wall placement |
| canSpend / spend | `server/services/credits/` | Credit check and transactions |
| publish / list / like | `server/services/gallery/` | Gallery CRUD + anonymous likes |
| createOrder | `server/services/orders/createOrder.ts` | Order + credit deduction in transaction |
| generatePrintAsset | `server/services/print/generatePrintAsset.ts` | Sharp-based print file generation |
| sendEmail | `server/services/email/sendEmail.ts` | Order confirmation emails |

### Key Components

| Component | File | Purpose |
|-----------|------|---------|
| Button | `components/ui/Button.tsx` | Variants: primary/secondary/ghost/outline, sizes: sm/md/lg |
| Card | `components/ui/Card.tsx` | Variants: default/elevated/bordered |
| LanguageSwitcher | `components/ui/LanguageSwitcher.tsx` | EN/SV toggle |
| RoomUpload | `components/poster/RoomUpload.tsx` | Drag-drop image upload |
| WallMarker | `components/poster/WallMarker.tsx` | Click 4 corners, drag to adjust |
| StylePicker | `components/poster/StylePicker.tsx` | 18 styles with color preview |
| MockupPreview | `components/poster/MockupPreview.tsx` | CSS-based wall placement |
| CreditBadge | `components/poster/CreditBadge.tsx` | Credit balance display |

### i18n System

- Dictionaries: `src/i18n/en.json`, `src/i18n/sv.json`
- Provider: `src/lib/i18n/context.tsx` → `I18nProvider` + `useTranslation()` hook
- Locale stored in `localStorage('wallcraft-locale')`
- All Wallcraft pages use English strings (translated from Swedish)

### Database Models (Prisma)

**Design & Gallery:**
- `Design` — style, roomType, colorMood, likesCount, position/scale/frame/size state
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
- `ShippingAddress` — full address with ISO country code
- `Fulfillment` — print status per item: partner, tracking, timestamps
- `PrintPartner` — seeded: Crimson (crimson.se, Stockholm)

### Print Pipeline

```
Design editor → PATCH auto-save (position, scale, crop, frame, size)
  → Order created → Stripe checkout → Webhook confirms payment
  → GENERATE_PRINT_FINAL triggered (non-blocking)
  → renderFinalPrint.ts: fetch design + crop from DB → Sharp processing → Blob upload → DesignAsset
  → Admin UI: shows READY/MISSING for PRINT_FINAL with download link
```

### Brand Style

- Background: `#FAFAF8` (warm off-white)
- Scandinavian modern, minimal, warm neutral tones
- Font: light weight headings, medium body
- `rounded-2xl` cards, `rounded-xl` buttons
- No clutter, no neon

---

## Known Limitations & TODO

### For Production
- [ ] **Auth** — No real authentication. Uses cookie-based `anonId`
- [ ] **Remaining Swedish** — poster-lab, admin UI, some components still have Swedish strings
- [ ] **Frame assets** — PNG placeholders, need real frame images
- [ ] **Tests** — No test suite

### Nice to Have
- [ ] **SEO** — Meta tags, OG images for Wallcraft pages
- [ ] **Onboarding** — First-visit tutorial
- [ ] **Gallery seeding** — Pre-populate with example designs
- [ ] **More creative tools** — Typography tool, collage maker, etc.
- [ ] **Social sharing** — Share designs to social media

---

## Git

| Remote | URL |
|--------|-----|
| `origin` | https://github.com/Mats6102hamberg/artboris.git |

Push: `git push origin main`

---

*Last updated: 2026-02-13 · Built with Cascade AI*
