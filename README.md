# Artboris — Art Platform

> Create unique art for your walls — with interactive creative tools, AI generation, room preview, and print ordering.

**GitHub:** https://github.com/Mats6102hamberg/artboris
**Live:** https://artboris.vercel.app/

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TailwindCSS 4 |
| Backend | Next.js API Routes (App Router) |
| AI | OpenAI GPT-4 (valuation, chatbot), DALL-E 3 (image generation) |
| Database | PostgreSQL + Prisma ORM |
| Storage | Vercel Blob (persistent image storage) |
| Payments | Stripe (checkout + webhooks) |
| Image Processing | Sharp (server-side), Canvas API (client-side) |
| i18n | Custom EN/SV system with context provider |

---

## Products

### Wallcraft — AI-Designed Art for Your Home

The main product. A complete pipeline from creation to print delivery.

**URL:** `/wallcraft` (planned: wallcraft.artboris.com)

#### Creative Tools

| Tool | Route | Description |
|------|-------|-------------|
| **Mandala Maker** | `/wallcraft/mandala` | Draw symmetric mandala patterns with 4–16 fold radial symmetry. Brush, eraser, color palettes, undo/redo. |
| **Pattern Studio** | `/wallcraft/pattern` | Create seamless repeating tile patterns. 4 repeat modes (grid, brick, mirror, diagonal). Shape tools (line, circle, rect). Live preview. Exports 1024px tiled image. |
| **Abstract Painter** | `/wallcraft/abstract` | Generative flow-field particle painting. 5 flow styles (smooth, turbulent, spiral, waves, organic). Real-time animation with controls for particles, speed, trail, size, complexity. |
| **Color Field Studio** | `/wallcraft/colorfield` | Minimalist color field compositions inspired by Rothko and Albers. 12 preset palettes, 5 layouts, 5 textures, 4 edge modes. Adjustable padding, gap, and corner radius. |
| **Design Studio** | `/wallcraft/studio` | Upload room photo → mark wall → pick style → AI generates 4 variants (DALL-E 3) → edit in room mockup → order print. |

All creative tools share:
- **Refine** — Local canvas image processing (smoothing, contrast, vibrance, depth glow) with before/after slider comparison
- **Use as Wall Art** — Export to Blob → create Design → open in design editor
- **Download PNG** — Direct export
- **Mobile responsive** — Touch support, adaptive layouts
- **Premium Scandinavian UI** — Warm off-white (#FAFAF8), rounded cards, subtle animations

#### Design Studio Flow

```
Upload room → Mark wall (4 corners) → Pick style (18 styles)
  → AI generates 4 variants (DALL-E 3)
  → Select favorite → Refine with controls (mood, color, contrast)
  → Editor: position on wall, pick frame & size
  → Checkout: buy credits → order print
  → (Optional) Share to inspiration gallery
```

#### 18 Art Styles

Nordic · Retro · Minimal · Abstract · Botanical · Geometric · Watercolor · Line Art · Photography · Typographic · Pop Art · Japanese · Art Deco · Surrealism · Graffiti · Pastel · Dark & Moody · Mid-Century

#### Gallery

Public inspiration gallery with filtering by style, sorting, anonymous likes (cookie-based anonId), and "Create similar" CTA.

---

### Art Scanner

Scans auction houses (Bukowskis, Barnebys, Auctionet, Tradera) for undervalued artworks. GPT-4 valuation with confidence levels, profit margins, and buy/hold/avoid recommendations.

### BorisArt AI

GPT-4 chatbot for art questions — artists, styles, valuations, market trends, investment advice.

### My Artworks

Personal art collection manager — upload images, save metadata (artist, technique, size, purchase price), gallery view.

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                        # Art Scanner (home)
│   ├── wallcraft/
│   │   ├── page.tsx                    # Landing page (hero, tools, featured, CTA)
│   │   ├── layout.tsx                  # I18nProvider wrapper
│   │   ├── studio/page.tsx             # AI creation flow
│   │   ├── result/page.tsx             # Variant selection
│   │   ├── design/[id]/page.tsx        # Design editor (frame, size, position)
│   │   ├── gallery/page.tsx            # Inspiration gallery
│   │   ├── checkout/page.tsx           # Checkout flow
│   │   ├── mandala/page.tsx            # Mandala Maker
│   │   ├── pattern/page.tsx            # Pattern Studio
│   │   ├── abstract/page.tsx           # Abstract Painter
│   │   └── colorfield/page.tsx         # Color Field Studio
│   ├── admin/orders/page.tsx           # Admin order management
│   ├── order/[id]/page.tsx             # Order confirmation
│   ├── poster-lab/                     # Legacy poster lab (original version)
│   └── api/
│       ├── designs/generate/           # AI generation (4 variants)
│       ├── designs/[id]/               # GET/PATCH design + print-final
│       ├── rooms/upload/               # Room photo upload
│       ├── credits/                    # Balance + spend
│       ├── gallery/                    # List, like, publish
│       ├── orders/create/              # Create order
│       ├── checkout/                   # Stripe checkout session
│       ├── webhook/stripe/             # Stripe webhook handler
│       ├── admin/orders/               # Admin CRUD
│       └── renders/final/              # Print-ready render
├── components/
│   ├── ui/                             # Button, Card, LanguageSwitcher
│   └── poster/                         # RoomUpload, WallMarker, StylePicker, etc.
├── lib/
│   ├── mandala/refineArtwork.ts        # Local canvas refinement engine
│   ├── i18n/                           # I18nProvider, useTranslation, dictionaries
│   ├── prompts/                        # 18 styles, prompt templates, safety filter
│   ├── pricing/                        # Credits, prints
│   ├── demo/                           # Demo images and fallback logic
│   └── anonId.ts                       # Cookie-based anonymous identification
├── server/services/
│   ├── ai/                             # generatePreview, refinePreview, generateFinalPrint
│   ├── mockup/                         # composeMockup
│   ├── credits/                        # canSpend, spend
│   ├── gallery/                        # publish, list, like
│   ├── orders/                         # createOrder
│   ├── email/                          # sendEmail
│   └── print/                          # generatePrintAsset
├── i18n/                               # en.json, sv.json dictionaries
└── types/                              # design.ts, room.ts, order.ts
```

---

## Getting Started

```bash
git clone https://github.com/Mats6102hamberg/artboris.git
cd artboris
npm install
npm run dev
```

Open http://localhost:3000 — works in demo mode without API keys.

**With full AI features (optional):**
```bash
cp .env.example .env.local
# Fill in: OPENAI_API_KEY, DATABASE_URL, STRIPE_SECRET_KEY, etc.
npx prisma migrate dev
```

## Environment Variables

| Variable | Description | Required? |
|----------|-------------|-----------|
| `DATABASE_URL` | PostgreSQL connection string | No (demo mode) |
| `OPENAI_API_KEY` | OpenAI API key (GPT-4 + DALL-E 3) | No (demo mode) |
| `STRIPE_SECRET_KEY` | Stripe secret key | Yes, for payments |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Yes, for webhooks |
| `REPLICATE_API_TOKEN` | Replicate API token for upscaling | Yes, for print |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token for image storage | Yes, for print |
| `NEXT_PUBLIC_APP_URL` | App URL for redirects | No |

## Database Models (Prisma)

**Design & Gallery:** Design, DesignVariant, DesignAsset, Like, RoomMeta
**Credits:** CreditAccount, CreditTransaction
**Orders:** Order, OrderItem, Payment, ShippingAddress, Fulfillment, PrintPartner

## Credits System

| Package | Credits | Price |
|---------|---------|-------|
| Starter | 10 | 49 kr |
| Creator | 30 | 99 kr |
| Pro | 75 | 199 kr |
| Studio | 200 | 449 kr |

| Action | Cost |
|--------|------|
| Generate 4 variants | 2 credits |
| Refine variant | 1 credit |
| Print-ready render | 5 credits |

---

## Status

| Feature | Status |
|---------|--------|
| Wallcraft Landing Page | ✅ Done |
| Design Studio (18 styles, AI generation) | ✅ Done |
| Mandala Maker + Refine | ✅ Done |
| Pattern Studio | ✅ Done |
| Abstract Painter | ✅ Done |
| Color Field Studio | ✅ Done |
| Design Editor (frame, size, position) | ✅ Done |
| Demo mode (no API key needed) | ✅ Done |
| i18n (EN/SV) | ✅ Done |
| Gallery (filter, sort, likes) | ✅ Done |
| Stripe Checkout | ✅ Done |
| Admin Order Management | ✅ Done |
| Print Pipeline (Sharp + Blob) | ✅ Done |
| PrintPartner (Crimson) | ✅ Seeded |
| Mobile responsive | ✅ Done |
| Art Scanner | ✅ Done |
| BorisArt AI Chatbot | ✅ Done |

---

*Built with Cascade AI · February 2026*
