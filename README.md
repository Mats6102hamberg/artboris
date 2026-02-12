# Artboris — Art Scanner + Poster Lab

> **GitHub:** https://github.com/Mats6102hamberg/usk

En Next.js-applikation med två huvudmoduler:

1. **Art Scanner** — Skannar svenska auktionssajter efter undervärderade konstverk med AI-baserad värdering
2. **Poster Lab** — Kreativt verktyg där användare experimenterar fram egen konst, ser den på sin vägg och beställer tryck

---

## Tech Stack

| Lager | Teknik |
|-------|--------|
| Frontend | Next.js 16, React 19, TailwindCSS 4 |
| Backend | Next.js API Routes (App Router) |
| AI | OpenAI GPT-4 (värdering, chatbot), DALL-E 3 (bildgenerering) |
| Databas | PostgreSQL + Prisma ORM |
| Scraping | Axios, Cheerio, Puppeteer (stealth) |

## Projektstruktur

```
src/
├── app/
│   ├── page.tsx                    # Art Scanner huvudsida
│   ├── poster-lab/
│   │   ├── page.tsx                # Steg 1: Upload rum + välj stil
│   │   ├── result/page.tsx         # Steg 2: 4 AI-genererade förslag
│   │   ├── editor/page.tsx         # Steg 3: Placera på vägg + ram + storlek
│   │   ├── gallery/page.tsx        # Inspirationsgalleri
│   │   └── checkout/page.tsx       # Köp credits + beställ tryck
│   └── api/
│       ├── scan/                   # Auktionsskanning
│       ├── boris-ai/               # BorisArt AI chatbot
│       ├── my-artworks/            # CRUD för egna konstverk
│       ├── rooms/upload/           # Rumsfoto-uppladdning
│       ├── designs/generate/       # AI-generering (4 varianter)
│       ├── designs/refine/         # Förfina variant
│       ├── mockups/render/         # Mockup på vägg
│       ├── credits/balance/        # Creditsaldo
│       ├── credits/spend/          # Köp/dra credits
│       ├── orders/create/          # Skapa order
│       ├── renders/final/          # Slutrender för tryck
│       ├── gallery/publish/        # Publicera till galleri
│       └── gallery/list/           # Lista galleri
├── components/
│   ├── poster/                     # 10 Poster Lab-komponenter
│   ├── BorisArtChat.tsx
│   └── MyArtworks.tsx
├── server/services/                # Backend-logik
│   ├── ai/                         # generatePreview, refinePreview, generateFinalPrint
│   ├── mockup/                     # composeMockup (CSS-baserad)
│   ├── credits/                    # canSpend, spend
│   ├── gallery/                    # publish, list
│   └── orders/                     # createOrder
├── lib/
│   ├── prompts/                    # AI-prompts: templates, styles (12 st), safety
│   ├── image/                      # transform, resize, watermark
│   ├── pricing/                    # credits, prints
│   ├── scrapers.ts                 # Bukowskis, Barnebys, Auctionet, Tradera
│   ├── aiValuation.ts              # GPT-4 värdering
│   ├── borisArtAI.ts               # BorisArt chatbot
│   ├── priceAnalyzer.ts            # Heuristisk prisanalys (fallback)
│   └── prisma.ts                   # Prisma singleton
├── types/
│   ├── design.ts                   # Design, Variant, Controls, Style, Frame, Size
│   ├── room.ts                     # Room, WallCorners
│   └── order.ts                    # Order, Credits, Shipping
└── assets/frames/                  # Ram-bilder (placeholder)
```

## Kom igång

```bash
# 1. Installera
npm install

# 2. Konfigurera miljövariabler
cp .env.example .env
# Fyll i DATABASE_URL och OPENAI_API_KEY

# 3. Databas
npx prisma migrate dev

# 4. Starta
npm run dev
```

Öppna http://localhost:3000

## Miljövariabler

| Variabel | Beskrivning |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `OPENAI_API_KEY` | OpenAI API-nyckel (GPT-4 + DALL-E 3) |

## Databasmodeller (Prisma)

- **Artwork** — Sparade konstverk (Art Scanner)
- **CreditAccount** — Creditsaldo per användare
- **CreditTransaction** — Köp/förbrukningshistorik
- **GalleryItem** — Publicerade designs i galleriet
- **PosterOrder** — Beställningar med status-tracking

## Poster Lab — Flöde

```
Upload rum → Markera vägg (4 hörn) → Välj stil (12 stilar)
    → Generera 4 AI-varianter (DALL-E 3)
    → Välj favorit → Förfina med kontroller (mood, färg, kontrast, text)
    → Editor: placera på vägg, välj ram & storlek
    → Checkout: köp credits → beställ tryck
    → (Valfritt) Dela i inspirationsgalleriet
```

## Credits-system

| Paket | Credits | Pris |
|-------|---------|------|
| Starter | 10 | 49 kr |
| Creator | 30 | 99 kr |
| Pro | 75 | 199 kr |
| Studio | 200 | 449 kr |

| Åtgärd | Kostnad |
|--------|---------|
| Generera 4 förslag | 2 credits |
| Förfina variant | 1 credit |
| Slutrender för tryck | 5 credits |

---

**Lokal sökväg:** `/Users/matshamberg/CascadeProjects/Artboris`
**GitHub:** https://github.com/Mats6102hamberg/usk
