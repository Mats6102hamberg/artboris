# 🎨 Artboris — AI-driven Konstplattform

> Hitta undervärderade konstverk, analysera marknaden och skapa unik konst för din vägg — allt i en app.

**GitHub:** https://github.com/Mats6102hamberg/artboris  
**Teknik:** Next.js 16 · React 19 · TailwindCSS · Prisma · PostgreSQL · OpenAI GPT-4 + DALL-E 3 · TypeScript  
**Lokal sökväg:** `/Users/matshamberg/CascadeProjects/Artboris`

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
| **Analys-modal** | Bild, prisanalys, marknadsdata, trend, KÖP/HÅLL/UNDVIK |
| **Portfölj** | Spara och följ intressanta objekt |

---

### 2. 🤖 BorisArt AI — Konstassistent

En AI-chattbot byggd på GPT-4 som svarar på frågor om:
- Konstnärer och deras verk
- Konststilar och epoker
- Värderingar och marknadstrender
- Investeringsråd för konst

---

### 3. 🖼️ Mina Tavlor — Personlig konstsamling

Hantera och visa dina egna konstverk:
- Ladda upp bilder
- Spara metadata (konstnär, teknik, storlek, inköpspris)
- Visa i en snygg gallerivy

---

### 4. 🎨 Poster Lab — AI-driven Konstskapare

Skapa unik konst för din vägg med AI. Komplett flöde från rum till beställning.

#### Flöde
```
📷 Ladda upp rum → 📐 Markera vägg → 🎨 Välj stil → 🤖 AI genererar 4 varianter
→ 🔍 Välj favorit → 🖼️ Redigera (ram, storlek, placering) → 💳 Beställ tryck
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

#### Funktioner
- **Demo-läge** — Fungerar helt utan OpenAI API-nyckel
- **Mobilanpassad** — Touch-stöd, responsiva layouter, sticky knappar
- **Zoom-lightbox** — Dubbelklicka för fullscreen på varianter
- **Galleri** — 12 seedade designs med filtrering, sortering och likes
- **Credit-system** — Prisberäkning för tryck och ramar
- **Konfetti-animation** — Vid orderbekräftelse
- **Mörk landingpage** — Med animationer, scrollande stilgalleri och glödande CTA

---

## Projektstruktur

```
src/
├── app/
│   ├── page.tsx                    # Art Scanner (huvudsida)
│   ├── poster-lab/
│   │   ├── page.tsx                # Poster Lab (landing + create-flöde)
│   │   ├── result/page.tsx         # Variant-val med zoom
│   │   ├── editor/page.tsx         # Ram, storlek, placering
│   │   ├── gallery/page.tsx        # Inspirationsgalleri
│   │   └── checkout/page.tsx       # Kassa med konfetti
│   └── api/
│       ├── scan/                   # Art Scanner API
│       ├── rooms/upload/           # Rumsuppladdning
│       ├── designs/generate/       # AI-generering
│       ├── designs/refine/         # Förfining
│       ├── mockups/render/         # Mockup-rendering
│       ├── credits/                # Credit-hantering
│       ├── orders/create/          # Orderhantering
│       ├── renders/final/          # Slutrender
│       └── gallery/                # Galleri (list + like)
├── components/
│   ├── BorisArtChat.tsx            # AI-chattassistent
│   ├── MyArtworks.tsx              # Mina tavlor
│   └── poster/                     # 10 Poster Lab-komponenter
├── lib/
│   ├── prompts/                    # 18 stilar, promptmallar, säkerhetsfilter
│   ├── image/                      # Bildhantering (transform, resize, watermark)
│   ├── pricing/                    # Credits och tryckkostnader
│   └── demo/                       # Demo-bilder och fallback-logik
├── server/services/
│   ├── ai/                         # generatePreview, refinePreview, generateFinalPrint
│   ├── mockup/                     # composeMockup
│   ├── credits/                    # canSpend, spend
│   ├── gallery/                    # publish, list
│   └── orders/                     # createOrder
├── types/                          # TypeScript-typer (design, room, order)
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

# Öppna
open http://localhost:3000
```

**Med AI-funktioner (valfritt):**
```bash
# Skapa .env.local
echo "OPENAI_API_KEY=sk-..." > .env.local
echo "DATABASE_URL=postgresql://..." >> .env.local

# Migrera databas
npx prisma migrate dev
```

---

## Status

| Funktion | Status |
|----------|--------|
| Art Scanner | ✅ Klar |
| BorisArt AI | ✅ Klar |
| Mina Tavlor | ✅ Klar |
| Poster Lab | ✅ Klar |
| Demo-läge | ✅ Klar |
| Mobilanpassning | ✅ Klar |
| 18 konststilar | ✅ Klar |

---

*Byggt med Cascade AI · Februari 2026*
