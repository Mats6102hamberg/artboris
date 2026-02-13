# Artboris — Art Platform Overview

> Create unique art for your walls — with interactive creative tools, AI generation, room preview, and print ordering.

**GitHub:** https://github.com/Mats6102hamberg/artboris
**Vercel:** https://artboris.vercel.app/
**Tech:** Next.js 16 · React 19 · TailwindCSS 4 · Prisma · PostgreSQL · OpenAI GPT-4 + DALL-E 3 · Stripe · Sharp · Vercel Blob
**Local path:** `/Users/matshamberg/CascadeProjects/Artboris`

---

## Products

### 1. Wallcraft — AI-Designed Art for Your Home (Main Product)

Complete pipeline from creation to print delivery. URL: `/wallcraft`

#### Creative Tools (4 interactive tools)

| Tool | Route | What it does |
|------|-------|-------------|
| **Mandala Maker** | `/wallcraft/mandala` | Radial symmetry drawing (4–16 fold). Brush, eraser, color palettes, undo/redo. |
| **Pattern Studio** | `/wallcraft/pattern` | Seamless tile patterns. 4 repeat modes (grid/brick/mirror/diagonal). Shape tools. Live preview. 1024px export. |
| **Abstract Painter** | `/wallcraft/abstract` | Generative flow-field particle painting. 5 styles, real-time animation, 8 palettes. |
| **Color Field Studio** | `/wallcraft/colorfield` | Minimalist compositions (Rothko/Albers). 12 presets, 5 layouts, 5 textures, 4 edge modes. |

All tools share: **Refine** (local canvas processing), **before/after slider**, **Use as Wall Art** (→ design editor), **Download PNG**, mobile responsive.

#### Design Studio

```
Upload room → Mark wall (4 corners) → Pick style (18 styles)
  → AI generates 4 variants (DALL-E 3)
  → Select → Refine → Editor (frame, size, position)
  → Checkout (Stripe) → Print order
```

18 styles: Nordic · Retro · Minimal · Abstract · Botanical · Geometric · Watercolor · Line Art · Photography · Typographic · Pop Art · Japanese · Art Deco · Surrealism · Graffiti · Pastel · Dark & Moody · Mid-Century

#### Gallery
Public inspiration gallery with filtering, sorting, anonymous likes, "Create similar" CTA.

#### Print Pipeline
Design editor auto-saves → Stripe checkout → webhook → Sharp processing → Vercel Blob → PrintPartner (Crimson, Stockholm)

---

### 2. Art Scanner
Scans Bukowskis, Barnebys, Auctionet, Tradera for undervalued artworks. GPT-4 valuation with confidence, profit margins, buy/hold/avoid recommendations. Filters, sorting, portfolio tracking.

### 3. BorisArt AI
GPT-4 chatbot for art questions — artists, styles, valuations, market trends, investment advice.

### 4. My Artworks
Personal art collection manager — upload, metadata, gallery view.

---

## Key Architecture

```
src/
├── app/wallcraft/                    # Wallcraft product (10 routes)
│   ├── page.tsx                      # Landing page
│   ├── mandala/ pattern/ abstract/ colorfield/  # Creative tools
│   ├── studio/ result/ design/[id]/  # AI design flow
│   ├── gallery/ checkout/            # Gallery + checkout
│   └── layout.tsx                    # I18nProvider
├── app/admin/orders/                 # Admin order management
├── app/api/                          # 15+ API routes
├── components/ui/                    # Button, Card, LanguageSwitcher
├── components/poster/                # RoomUpload, WallMarker, StylePicker, etc.
├── lib/mandala/refineArtwork.ts      # Local canvas refinement engine
├── lib/i18n/                         # EN/SV translation system
├── lib/prompts/                      # 18 styles, templates, safety filter
├── server/services/                  # AI, credits, gallery, orders, print, email
├── i18n/                             # en.json, sv.json
└── types/                            # design.ts, room.ts, order.ts
```

**Database:** Design, DesignVariant, DesignAsset, Like, RoomMeta, CreditAccount, CreditTransaction, Order, OrderItem, Payment, ShippingAddress, Fulfillment, PrintPartner

**Credits:** Starter (10/49kr) · Creator (30/99kr) · Pro (75/199kr) · Studio (200/449kr)

---

## Status

| Feature | Status |
|---------|--------|
| Wallcraft Landing + Navigation | ✅ Done |
| Mandala Maker + Refine | ✅ Done |
| Pattern Studio | ✅ Done |
| Abstract Painter | ✅ Done |
| Color Field Studio | ✅ Done |
| Design Studio (18 styles, AI) | ✅ Done |
| Design Editor (frame, size, position) | ✅ Done |
| Gallery (filter, sort, likes) | ✅ Done |
| Demo mode | ✅ Done |
| i18n (EN/SV) | ✅ Done |
| Stripe Checkout + Webhooks | ✅ Done |
| Admin Order Management | ✅ Done |
| Print Pipeline (Sharp + Blob) | ✅ Done |
| PrintPartner (Crimson) | ✅ Seeded |
| Mobile responsive | ✅ Done |
| Art Scanner | ✅ Done |
| BorisArt AI | ✅ Done |

---

*Built with Cascade AI · February 2026*
