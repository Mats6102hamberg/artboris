# SESSION SUMMARY — Artboris

## Projekt
- **Namn:** Artboris (Art Scanner / WallCraft / Poster Lab)
- **Lokal mapp:** `/Users/matshamberg/CascadeProjects/Artboris`
- **GitHub:** `https://github.com/Mats6102hamberg/artboris.git`
- **Branch:** `main`
- **Deploy:** Vercel (kopplat till GitHub-repot)
- **Senaste commit:** `410f818`

## Tech Stack
- Next.js 16, React 19, TypeScript
- Tailwind CSS 4
- Prisma + Neon Postgres
- Replicate (Flux Schnell) for AI image generation
- Stripe (betalning), Resend (e-post), Vercel Blob (lagring)

## Vad som implementerades denna session

### 1. Checkout-bugg fixad (STRIPE_SECRET_KEY)
- **Problem:** `/api/checkout` returnerade "Kunde inte skapa checkout-session"
- **Orsak:** `STRIPE_SECRET_KEY` saknades helt i `.env.local` och på Vercel
- **Fix:** Stripe CLI installerat, nycklar hämtade och konfigurerade lokalt + Vercel
- Lade till validering av Stripe-nyckel, designId-existens, enum-validering, rollback vid fel
- Stripe checkout fungerar nu med Apple Pay, Klarna, kort

### 2. Storleksbugg i kundvagnen fixad
- **Problem:** Kundvagnen visade 277×396 cm istället för 70×100 cm
- **Orsak:** `widthCm * scale` — preview-skalan multiplicerades med fysisk storlek
- **Fix:** Använder `sz.widthCm` / `sz.heightCm` direkt utan skalfaktor

### 3. Skapa → Publicera → Sälj-flödet kopplat ihop
- **PublishToggle** i WallCraft/poster-lab anropar nu API direkt (var dead code)
- **publishToGallery()** uppdaterar befintlig design (skapade tidigare duplicat)
- **API-route** använder `getOrCreateAnonId()` server-side
- **MyArtworks status-bugg** fixad (`available` vs `tillgänglig`)
- **"Vill du sälja din konst?"** CTA visas i editorn + galleriet → `/market/artist`

### 4. Stripe CLI + env-konfiguration
- Stripe CLI v1.35.0 installerat via Homebrew
- Inloggad: `mats hamberg - sandlåda` (`acct_1S9DVzJjhIlYlC5Y`)
- Vercel env vars tillagda: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_APP_URL`

### Ändrade filer
- `src/app/api/checkout/route.ts` — Robust checkout med validering + rollback
- `src/app/wallcraft/design/[id]/page.tsx` — PublishToggle kopplad + storleksfix + sälj-CTA
- `src/app/poster-lab/design/[id]/page.tsx` — PublishToggle kopplad + sälj-CTA
- `src/server/services/gallery/publish.ts` — Omskriven: update istället för create
- `src/app/api/gallery/publish/route.ts` — Ny signatur med anonId server-side
- `src/app/api/my-artworks/route.ts` — Status-sträng fixad
- `src/components/MyArtworks.tsx` — Hanterar båda status-värden
- `src/app/wallcraft/gallery/page.tsx` — Sälj-CTA banner
- `HANDOVER.md` — Uppdaterad med alla fixar

## Environment Variables (krävs)
- `REPLICATE_API_TOKEN` — Replicate API-nyckel
- `DATABASE_URL` — Neon Postgres connection string
- `DATABASE_URL_UNPOOLED` — Neon Postgres direkt-anslutning
- `STRIPE_SECRET_KEY` — Stripe test/live nyckel
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Stripe publishable key
- `NEXT_PUBLIC_APP_URL` — App URL (localhost eller Vercel)

## Kända issues / TODO (nästa session)
- Drag-upplevelsen kan finslipas ytterligare
- Art Scanner portfolio sparas bara i minne (inte i DB)
- Inget riktigt auth-system (anonId-cookies)
- SEO saknas (meta-taggar, OG-bilder)

## Git-historik denna session
```
410f818 feat: koppla ihop Skapa → Publicera → Sälj-flödet
ed3b846 fix: använd riktig printstorlek i kundvagn, inte preview-skala
cd648a7 fix: robust checkout — validera Stripe-nyckel, designId, enums + rollback vid fel
```
