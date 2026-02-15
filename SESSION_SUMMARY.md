# SESSION SUMMARY — Artboris

## Projekt
- **Namn:** Artboris (Art Scanner / WallCraft / Poster Lab)
- **Lokal mapp:** `/Users/matshamberg/CascadeProjects/Artboris`
- **GitHub:** `https://github.com/Mats6102hamberg/artboris.git`
- **Branch:** `main`
- **Deploy:** Vercel (kopplat till GitHub-repot)
- **Senaste commit:** `46f44e8`

## Tech Stack
- Next.js 16, React 19, TypeScript
- Tailwind CSS 4
- Prisma + Neon Postgres
- Replicate (Flux Schnell) for AI image generation
- Stripe (betalning), Resend (e-post), Vercel Blob (lagring)

## Vad som implementerades denna session

### WallCraft MockupPreview — stora UX-förbättringar
1. **Motivet centrerat i ramen** — Ersatte buggy padding/margin-trick med ren calc()-baserad layout
2. **Borttagen referenskontur** — Vita streckade linjer som störde togs bort
3. **Proportionell rambredd** — Ramen skalas nu med motivets storlek (inte fasta pixlar)
4. **Förbättrad drag-UX** — Grab/grabbing cursor, 1:1 mappning mellan mus och motiv
5. **Osynliga resize-handtag** — Vita hörn borttagna, osynliga drag-ytor med cursor-feedback
6. **Bättre felmeddelanden** — Generate-route visar nu detaljerat fel istället för generiskt
7. **Fri posterrörelse** — Postern kan nu placeras fritt över hela väggfotot, inte begränsad till väggområdet

### Ändrade filer
- `src/components/poster/MockupPreview.tsx` — Huvudsakliga UX-fixar
- `src/lib/image/transform.ts` — Fri positionering med väggcentrum som ankare
- `src/app/api/designs/generate/route.ts` — Detaljerade felmeddelanden
- `src/server/services/usage/dailyUsage.ts` — Ändrad daggräns (5 → 50)

## Environment Variables (krävs)
- `REPLICATE_API_TOKEN` — Replicate API-nyckel
- `DATABASE_URL` — Neon Postgres connection string
- `DATABASE_URL_UNPOOLED` — Neon Postgres direkt-anslutning

## Kända issues / TODO (nästa session)
- Drag-upplevelsen kan finslipas ytterligare (Mats noterade att det behövs mer justering)
- Generering misslyckades tillfälligt (oklart varför — fungerade igen efteråt)
- SESSION_SUMMARY.md skapades denna session (saknades tidigare)

## Git-historik denna session
```
46f44e8 fix: free poster movement across full wall area
f6134e9 chore: add SESSION_SUMMARY.md, bump daily generation limit to 50
e156d7a fix: show detailed error message when generation fails
5bf4f45 fix: 1:1 cursor-to-poster drag mapping
c366eb8 fix: improve poster grab UX — grab cursor, transparent hit area
0e8387e fix: make frame width proportional to poster size
d894a6a fix: reduce frame width from 0.4x to 0.15x
7ebddff fix: remove visible corner handles
27daeb3 feat: improve poster drag & resize UX
ee52d03 fix: center poster in frame, remove reference outline, expand drag touch area
```
