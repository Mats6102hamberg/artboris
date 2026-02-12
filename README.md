# 🎨 Artboris — AI-driven Konstplattform

> Hitta undervärderade konstverk, analysera marknaden och skapa unik konst för din vägg — allt i en app.

**GitHub:** https://github.com/Mats6102hamberg/artboris

---

## Tech Stack

| Lager | Teknik |
|-------|--------|
| Frontend | Next.js 16, React 19, TailwindCSS 4 |
| Backend | Next.js API Routes (App Router) |
| AI | OpenAI GPT-4 (värdering, chatbot), DALL-E 3 (bildgenerering) |
| Databas | PostgreSQL + Prisma ORM |
| Scraping | Axios, Cheerio, Puppeteer (stealth) |

---

## Funktioner

### 1. 🔍 Art Scanner — Hitta undervärderad konst

Skannar auktionshus och marknadsplatser i realtid efter konstverk med vinstpotential.

| Funktion | Beskrivning |
|----------|-------------|
| **4 källor** | Bukowskis, Barnebys, Auctionet, Tradera |
| **Söktyper** | Målningar och Skulpturer |
| **AI-värdering** | Estimerat marknadsvärde, vinstmarginal, konfidensnivå |
| **Filter** | Minsta vinst (kr), prisintervall, vinstmarginal (%), risknivå, rekommendation |
| **Snabbfilter** | "Hög vinst (min 50k)", "Säkert val", "Återställ" |
| **Sortering** | Vinst, vinstmarginal, pris (stigande/fallande), konfidens |
| **Analys-modal** | Bild, prisanalys, marknadsdata, trend (stigande/stabil/fallande), KÖP/HÅLL/UNDVIK |
| **Portfölj** | Spara och följ intressanta objekt |

### 2. 🤖 BorisArt AI — Konstassistent

En AI-chattbot byggd på GPT-4 som svarar på frågor om:
- Konstnärer och deras verk
- Konststilar och epoker
- Värderingar och marknadstrender
- Investeringsråd för konst

### 3. 🖼️ Mina Tavlor — Personlig konstsamling

Hantera och visa dina egna konstverk:
- Ladda upp bilder
- Spara metadata (konstnär, teknik, storlek, inköpspris)
- Visa i en snygg gallerivy

### 4. 🎨 Poster Lab — AI-driven Konstskapare

Skapa unik konst för din vägg med AI. Komplett flöde från rum till beställning.

#### Flöde

```
📷 Ladda upp rum → 📐 Markera vägg (4 hörn) → 🎨 Välj stil (18 stilar)
    → 🤖 Generera 4 AI-varianter (DALL-E 3)
    → 🔍 Välj favorit → Förfina med kontroller (mood, färg, kontrast, text)
    → 🖼️ Editor: placera på vägg, välj ram & storlek
    → 💳 Checkout: köp credits → beställ tryck
    → (Valfritt) Dela i inspirationsgalleriet
```

#### 18 Konststilar

| Stil | Emoji | Beskrivning |
|------|-------|-------------|
| Nordic | 🌿 | Ljusa toner, skandinavisk enkelhet |
| Retro | 📻 | 70-tals vibbar, varma färger |
| Minimal | ◻️ | Rent, enkelt, begränsad palett |
| Abstract | 🎨 | Fria former, expressiva färger |
| Botanical | 🌸 | Växter, blommor, naturliga illustrationer |
| Geometric | 🔷 | Geometriska former, Bauhaus-inspirerat |
| Watercolor | 💧 | Mjuka akvarelltoner |
| Line Art | ✏️ | Eleganta linjeteckningar |
| Photography | 📷 | Fotografiskt, stämningsfullt |
| Typographic | 🔤 | Text som konst |
| Pop Art | 💥 | Warhol-inspirerat, starka färger |
| Japanese | 🌸 | Ukiyo-e, zen, japansk estetik |
| Art Deco | ✨ | Guld, geometri, 1920-tals glamour |
| Surrealism | 👁️ | Drömlandskap, Dalí-inspirerat |
| Graffiti | 🎤 | Street art, spray, urban kultur |
| Pastel | 🧁 | Mjuka pastelltoner, lugnt och ljust |
| Dark & Moody | 🌑 | Mörkt, dramatiskt, mystiskt |
| Mid-Century | 💎 | 50/60-tals design, retro-modern |

#### Poster Lab-funktioner

- **Demo-läge** — Fungerar helt utan OpenAI API-nyckel med lokala SVG-konstverk
- **Mobilanpassad** — Touch-stöd för väggmarkering, responsiva layouter, sticky knappar
- **Zoom-lightbox** — Dubbelklicka för fullscreen på varianter
- **Galleri** — Seedade designs med filtrering, sortering och likes
- **Credit-system** — Prisberäkning för tryck och ramar
- **Konfetti-animation** — Vid orderbekräftelse
- **Animerad landingpage** — Mörkt tema med scrollande stilgalleri och glödande CTA

---

## Projektstruktur

```
src/
├── app/
│   ├── page.tsx                    # Art Scanner (huvudsida)
│   ├── poster-lab/
│   │   ├── page.tsx                # Poster Lab (landing + create-flöde)
│   │   ├── result/page.tsx         # Variant-val med zoom-lightbox
│   │   ├── editor/page.tsx         # Ram, storlek, placering på vägg
│   │   ├── gallery/page.tsx        # Inspirationsgalleri med filter
│   │   └── checkout/page.tsx       # Kassa med konfetti
│   └── api/
│       ├── scan/                   # Auktionsskanning
│       ├── boris-ai/               # BorisArt AI chatbot
│       ├── my-artworks/            # CRUD för egna konstverk
│       ├── rooms/upload/           # Rumsfoto-uppladdning
│       ├── designs/generate/       # AI-generering (4 varianter)
│       ├── designs/refine/         # Förfina variant
│       ├── mockups/render/         # Mockup på vägg
│       ├── credits/                # Creditsaldo + köp/dra
│       ├── orders/create/          # Skapa order
│       ├── renders/final/          # Slutrender för tryck
│       └── gallery/                # Lista + gilla i galleri
├── components/
│   ├── BorisArtChat.tsx            # AI-chattassistent
│   ├── MyArtworks.tsx              # Mina tavlor
│   └── poster/                     # 10 Poster Lab-komponenter
├── server/services/
│   ├── ai/                         # generatePreview, refinePreview, generateFinalPrint
│   ├── mockup/                     # composeMockup (CSS-baserad)
│   ├── credits/                    # canSpend, spend
│   ├── gallery/                    # publish, list
│   └── orders/                     # createOrder
├── lib/
│   ├── prompts/                    # 18 stilar, promptmallar, säkerhetsfilter
│   ├── image/                      # transform, resize, watermark
│   ├── pricing/                    # credits, prints
│   ├── demo/                       # Demo-bilder och fallback-logik
│   ├── scrapers.ts                 # Bukowskis, Barnebys, Auctionet, Tradera
│   ├── aiValuation.ts              # GPT-4 värdering
│   ├── borisArtAI.ts               # BorisArt chatbot
│   ├── priceAnalyzer.ts            # Heuristisk prisanalys (fallback)
│   └── prisma.ts                   # Prisma singleton
├── types/
│   ├── design.ts                   # Design, Variant, Controls, Style, Frame, Size
│   ├── room.ts                     # Room, WallCorners
│   └── order.ts                    # Order, Credits, Shipping
└── public/assets/demo/             # 16 SVG demo-konstverk + demo-rum
```

---

## Kom igång

```bash
# Klona
git clone https://github.com/Mats6102hamberg/artboris.git
cd artboris

# Installera
npm install

# Starta (fungerar i demo-läge utan API-nyckel)
npm run dev
```

Öppna http://localhost:3000

**Med AI-funktioner (valfritt):**
```bash
# Skapa .env.local
echo "OPENAI_API_KEY=sk-..." > .env.local
echo "DATABASE_URL=postgresql://..." >> .env.local

# Migrera databas
npx prisma migrate dev
```

## Miljövariabler

| Variabel | Beskrivning | Krävs? |
|----------|-------------|--------|
| `DATABASE_URL` | PostgreSQL connection string | Nej (demo-läge utan) |
| `OPENAI_API_KEY` | OpenAI API-nyckel (GPT-4 + DALL-E 3) | Nej (demo-läge utan) |

## Databasmodeller (Prisma)

- **Artwork** — Sparade konstverk (Art Scanner)
- **CreditAccount** — Creditsaldo per användare
- **CreditTransaction** — Köp/förbrukningshistorik
- **GalleryItem** — Publicerade designs i galleriet
- **PosterOrder** — Beställningar med status-tracking

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

## Status

| Funktion | Status |
|----------|--------|
| Art Scanner | ✅ Klar |
| BorisArt AI | ✅ Klar |
| Mina Tavlor | ✅ Klar |
| Poster Lab (18 stilar) | ✅ Klar |
| Demo-läge | ✅ Klar |
| Mobilanpassning | ✅ Klar |

---

*Byggt med Cascade AI · Februari 2026*
