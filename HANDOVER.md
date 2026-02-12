# Handover — Artboris / Poster Lab

**GitHub:** https://github.com/Mats6102hamberg/usk
**Lokal sökväg:** `/Users/matshamberg/CascadeProjects/Artboris`
**Senast uppdaterad:** 2026-02-12

---

## Projektöversikt

Artboris är en Next.js 16-app med två moduler:

1. **Art Scanner** — Skannar Bukowskis, Barnebys, Auctionet, Tradera efter undervärderade konstverk. Använder GPT-4 för AI-värdering och en heuristisk fallback (`priceAnalyzer.ts`). Inkluderar BorisArt AI-chatbot.

2. **Poster Lab** (NY) — Användare laddar upp rumsfoto, markerar vägg, väljer bland 12 stilar, får 4 AI-genererade posterförslag (DALL-E 3), redigerar (ram, storlek, placering), och beställer tryck via ett credit-system.

---

## Hur man kommer igång

```bash
cd /Users/matshamberg/CascadeProjects/Artboris
npm install
npx prisma migrate dev    # OBS: Ej kört ännu — krävs för nya tabeller
npm run dev
```

**Miljövariabler** (`.env`):
```
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
```

---

## Arkitektur — Poster Lab

### Användarflöde
```
/poster-lab          → Upload rum → Markera 4 hörn → Välj stil
/poster-lab/result   → Se 4 varianter → Justera (mood/färg/kontrast/text) → Förfina
/poster-lab/editor   → Placera på vägg → Ram → Storlek → Prisöversikt
/poster-lab/checkout → Köp credits → Beställ → Slutrender triggas
/poster-lab/gallery  → Inspirationsflöde (filtrera stil, sortera, gilla)
```

### Nyckelkomponenter
| Komponent | Fil | Ansvar |
|-----------|-----|--------|
| RoomUpload | `components/poster/RoomUpload.tsx` | Drag-drop bilduppladdning |
| WallMarker | `components/poster/WallMarker.tsx` | Klicka 4 hörn, dra för att justera |
| StylePicker | `components/poster/StylePicker.tsx` | 12 stilar med färgpreview |
| VariantsGrid | `components/poster/VariantsGrid.tsx` | 2×2 grid med val-indikator |
| ControlsPanel | `components/poster/ControlsPanel.tsx` | Mood, kontrast, ljus, mättnad, färg, text |
| MockupPreview | `components/poster/MockupPreview.tsx` | CSS-baserad väggplacering |
| FramePicker | `components/poster/FramePicker.tsx` | 6 ramalternativ |
| SizePicker | `components/poster/SizePicker.tsx` | 8 storlekar (A5–70×100) |

### Backend-tjänster
| Tjänst | Fil | Beskrivning |
|--------|-----|-------------|
| generatePreview | `server/services/ai/generatePreview.ts` | DALL-E 3, 4 parallella varianter |
| refinePreview | `server/services/ai/refinePreview.ts` | Ny variant baserad på feedback |
| generateFinalPrint | `server/services/ai/generateFinalPrint.ts` | HD-render (efter betalning) |
| composeMockup | `server/services/mockup/composeMockup.ts` | CSS-overlay för väggplacering |
| canSpend / spend | `server/services/credits/` | Credit-kontroll och transaktioner |
| publish / list | `server/services/gallery/` | Galleri CRUD + likes |
| createOrder | `server/services/orders/createOrder.ts` | Order + credit-avdrag i transaktion |

### Databasmodeller (Prisma)
```prisma
CreditAccount    — userId (unique), balance, totalPurchased, totalSpent
CreditTransaction — userId, amount, type, description, orderId
GalleryItem      — designId, userId, title, imageUrl, style, likes, isPublished
PosterOrder      — userId, designId, variantId, frameId, sizeId, status, creditsSpent
```

### Stilsystem (`lib/prompts/styles.ts`)
12 stilar: `nordic`, `retro`, `minimal`, `abstract`, `botanical`, `geometric`, `watercolor`, `line-art`, `photography`, `typographic`, `pop-art`, `japanese`

Varje stil har: label, description, promptPrefix, defaultMood, defaultColors.

### Säkerhet (`lib/prompts/safety.ts`)
Blocklista med ~30 termer (SV+EN) + regex-mönster. Kontrolleras innan varje AI-anrop.

---

## Kända begränsningar & TODO

### Kritiskt (för produktion)
- [ ] **Auth** — Ingen autentisering. `userId` är hårdkodat som `'demo-user'`
- [ ] **Betalning** — Credits köps utan riktig betalning (Stripe/Klarna behövs)
- [ ] **Bildlagring** — Rumsfoto sparas lokalt i `public/uploads/`. Behöver S3/Cloudinary
- [ ] **DB-migration** — `prisma migrate dev` har ej körts för de nya modellerna

### Bra att ha
- [ ] **Upscaling** — DALL-E 3 max 1024×1792. Behöver super-resolution för tryck
- [ ] **Asset-bilder** — Ram-PNG:er är placeholders
- [ ] **Perspektivtransform** — Fungerar med CSS. Server-side compositing (Sharp) för slutrender
- [ ] **E-post** — Orderbekräftelse
- [ ] **Admin** — Orderhantering, gallerimoderering

### Teknisk skuld
- [ ] TypeScript strict-check ej verifierad
- [ ] Inga tester
- [ ] Variants skickas via URL-params (kan bli för långt) — bör använda sessionStorage eller DB

---

## Git-remotes

| Remote | URL |
|--------|-----|
| `origin` | https://github.com/Mats6102hamberg/artboris.git |
| `usk` | https://github.com/Mats6102hamberg/usk.git |

Pusha med: `git push usk main`

---

## Kontakt & kontext

Projektet ligger i `/Users/matshamberg/CascadeProjects/Artboris` tillsammans med andra Cascade-projekt:
- Boris Type
- Petanque-Den-Kompletta-Guiden
- health-coach-ai
- net-sailor / net-sailor-core
- nursecore
- uskcore
