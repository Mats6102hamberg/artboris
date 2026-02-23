# SESSION SUMMARY — Artboris

## Projekt
- **Namn:** Artboris (Art Scanner / WallCraft / Poster Lab)
- **Lokal mapp:** `/Users/matshamberg/CascadeProjects/Artboris`
- **GitHub:** `https://github.com/Mats6102hamberg/artboris.git`
- **Branch:** `main`
- **Deploy:** Vercel (kopplat till GitHub-repot)
- **Senaste commit:** `bf71c1f`

## Tech Stack
- Next.js 16, React 19, TypeScript
- Tailwind CSS 4
- Prisma + Neon Postgres
- Replicate (Flux Schnell / Flux Dev) for AI image generation
- Stripe (betalning), Resend (e-post), Vercel Blob (lagring)
- Sentry (felmonitorering), CrashCatcher (förbered, ej aktivt)

## Vad som implementerades (alla sessioner)

### 1. Orderbekräftelse e-postval
- **Checkout:** Kund väljer "Skicka till min e-post" eller "Skicka till annan e-post"
- **Success-sida:** Knapp för att skicka orderbekräftelse till valfri e-post efter betalning
- **Prisma:** `confirmationEmail` (nullable) i ShippingAddress
- **API:** `/api/orders/send-receipt` (GET/POST) — hämta/skicka bekräftelse
- **Stripe:** `customer_email` sätts till vald mejl

### 2. Crimson tryckpartner-integration
- **Automatisk order:** E-post till Crimson skickas automatiskt vid betalad order (Stripe webhook)
- **E-postmall:** `CrimsonOrderNotification.tsx` — professionell mall med tryckfilslänkar, specs, leveransadress
- **Retry-mekanism:** Exponentiell backoff (3 försök: 1s, 2s, 4s) för alla e-postutskick
- **Admin resend:** "↻ Crimson"-knapp i admin/orders för att skicka om order till Crimson
- **Crimson webhook:** `POST /api/webhook/crimson` — tar emot statusuppdateringar (received, in_production, shipped)
- **Market-ordrar:** Crimson-mail skickas även för marketplace-ordrar
- **Delade funktioner:** `sendCrimsonEmail()`, `fetchPrintFileUrl()` — återanvändbar infrastruktur

### 3. Admin-prispanel (DB-driven priskonfiguration)
- **PricingConfig-modell:** Prisma-modell med JSON-fält för storlekar, ramar, papper + frakt/moms
- **Admin API:** `GET/PATCH /api/admin/pricing` — hämta/uppdatera priser, auto-seed vid första anrop
- **Publik API:** `GET /api/pricing` — strippar costSEK (kundinriktat), cachad 5 min
- **Server-side pricing:** `getPricingConfig()` med in-memory cache (5 min TTL), `calculateServerPrice()`
- **Admin-sida:** `/admin/pricing` — inline-redigering, marginalberäkning (%), färgkodad (grön/amber/röd)
- **Server-side prisvalidering:** Checkout beräknar pris server-side, loggar varning vid avvikelse > 1 kr
- **Säkerhet:** Klienten kan inte längre manipulera unitPriceCents

### 4. MockupPreview mobilförbättring
- **Resize-handtag:** 28px → 48px på touch-enheter (Apple minimum 44px)
- **Synliga hörnmarkeringar:** Vita L-formade hörn med skugga, alltid synliga på touch
- **+/- knappar:** Storleksändring via knappar nere till höger med procent-visning
- **Pinch-to-zoom hint:** "Nyp för att zooma" visas 3 sek på mobil

## Environment Variables (krävs)
- `REPLICATE_API_TOKEN` — Replicate API-nyckel
- `DATABASE_URL` — Neon Postgres connection string
- `DATABASE_URL_UNPOOLED` — Neon Postgres direkt-anslutning
- `STRIPE_SECRET_KEY` — Stripe test/live nyckel
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook signing secret
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Stripe publishable key
- `NEXT_PUBLIC_APP_URL` — App URL (localhost eller Vercel)
- `RESEND_API_KEY` — Resend e-posttjänst
- `CRIMSON_ORDER_EMAIL` — E-postadress för tryckorder till Crimson
- `CRIMSON_WEBHOOK_SECRET` — Hemlig nyckel för Crimson webhook
- `NEXT_PUBLIC_SENTRY_DSN` — Sentry DSN (felmonitorering)
- `SENTRY_ORG` — Sentry organisation (artboris)
- `SENTRY_PROJECT` — Sentry projekt (javascript-nextjs)
- `ADMIN_ALERT_EMAIL` — Admin e-post för felnotifieringar (mhg10mhg@gmail.com)
- `CRASHCATCHER_API_URL` — CrashCatcher URL (valfritt, ej aktivt)
- `CRASHCATCHER_API_KEY` — CrashCatcher API-nyckel (valfritt)

### 5. "Mina Tavlor" user-scoped
- **Prisma:** `userId` (String, default "") tillagd i `Artwork`-modellen + `@@index([userId])`
- **API:** `/api/my-artworks` — alla endpoints (GET/POST/PUT/DELETE) autentiserade via `getUserId()`
- **Ownership-check:** PUT/DELETE verifierar att `artwork.userId === userId` innan ändring
- **Mönster:** Samma som `ScannerPortfolioItem` — auth + anon fallback

### 6. AI Fallback + admin-notifikation
- **withAIRetry:** Retry med exponentiell backoff + felklassificering (transient vs permanent)
- **Cross-provider fallback:** Replicate Flux ↔ DALL-E 3 (generatePreview, refinePreview)
- **Admin email alerts:** Via Resend med 5 min debounce per tjänst till `mhg10mhg@gmail.com`
- **Filer:** `withAIRetry.ts`, `adminAlert.ts` (sendAIAdminAlert + sendErrorAdminAlert)

### 7. CrashCatcher + Supertestaren-integration (förberett)
- **crashcatcher.ts:** HTTP-klient med debounce, rapporterar till CrashCatcher API (ej aktivt utan `CRASHCATCHER_API_URL`)
- **Health endpoint:** `GET /api/health` — kollar DB, env-vars, returnerar 200/503
- **Error proxy:** `POST /api/report-error` — frontend kan rapportera fel utan att exponera API-nycklar
- **ErrorBoundary:** React error boundary i `Providers.tsx`, rapporterar till Sentry + CrashCatcher
- **apiErrorHandler.ts:** `withErrorReporting` wrapper för API-routes
- **Status:** CrashCatcher på is — Sentry används istället

### 8. Sentry felmonitorering (live)
- **SDK:** `@sentry/nextjs` v10 — klient + server
- **Konfigfiler:** `sentry.client.config.ts`, `sentry.server.config.ts`
- **Instrumentation:** `src/instrumentation.ts` — laddar Sentry server-side, fångar request errors
- **User context:** `SentryUserSync` komponent synkar session (user.id, email) till Sentry
- **API context:** `reportApiError()` tar `ErrorContext` med userId, orderId, designId som tags
- **Global error:** `global-error.tsx` rapporterar till Sentry
- **Vercel env:** `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT` konfigurerade
- **Edge fix:** Middleware borttagen (översteg 1MB edge-gräns), admin-auth flyttad till server-side layout

### 9. Admin-auth via server-side layout
- **Middleware borttagen:** `src/middleware.ts` importerade hela next-auth (>1MB edge function)
- **Ersatt med:** `src/app/admin/layout.tsx` — kontrollerar `auth()` server-side, redirect vid ej ADMIN

### 10. Boris-knappar synlighet
- **Floating (desktop):** Visar "Fråga Boris"-text på `lg:`, amber glow-skugga
- **Inline:** Starkare bakgrund (`amber-100`), mörkare text (`amber-900`), tydligare kant, permanent skugga

### 11. Remix-flöde mellan kreativa verktyg
- **RemixMenu:** "Remix in..." dropdown — auto-save till DB + JPEG 80% 1024px mellanlager
- **useSourceImage hook:** Läser ?sourceImage + ?remixDesignId + ?remixFrom, canvasReady-flagga
- **RemixBanner:** Visar "Remixed from X" + "View saved version" länk
- **Alla 4 verktyg wrappade i `<Suspense>`** (krävs av useSearchParams)
- **Filer:** `src/components/wallcraft/RemixMenu.tsx`, `src/hooks/useSourceImage.ts`

### 12. Högupplöst export (6000×6000px)
- **hiResExport.ts:** RENDER_SCALE=4, HIRES_EXPORT_SIZE=6000, upscaleCanvas(), exportHiResPng()
- **Mandala + Abstract:** Intern canvas = displaySize × 4, upscalas till 6000px vid export
- **Pattern:** Tile upscalas, repeteras till 6000×6000px
- **Color Field:** Programmatisk re-rendering i 6000×6000px
- **Alla exporterar JPEG 95%** (~2-5 MB istället för 20-50 MB PNG)
- **Upload-gräns höjd till 25 MB** i /api/rooms/upload
- **Fil:** `src/lib/wallcraft/hiResExport.ts`

### 13. AI Gallery-integration
- **Design.isAiGenerated** Boolean @default(false) — markerar AI-genererade designs
- **generatePreview.ts:** Sätter isAiGenerated: true vid AI-generering
- **PATCH /api/designs/[id]:** Stödjer isAiGenerated fält
- **Stripe webhook:** Auto-publicerar AI-designs till Gallery efter betalning (isPublic: true)
- **Gallery list API:** Stödjer `?aiOnly=true` filter, returnerar isAiGenerated
- **Gallery UI:** "✨ AI Art" filter-tab + lila "AI Generated" badge på kort
- **Demo gallery:** Alla demo-items har isAiGenerated: true

### 14. Legal copy — 4-nivå AI-villkor
- **Nivå 1 — Registrering** (`/auth/register`): Checkbox "Jag godkänner användarvillkoren" + länk till /terms. Submit disabled tills ikryssad.
- **Nivå 2 — Studio** (`/wallcraft/studio`, steg 3): Notice under generate-knappen: "AI-genererade motiv skapas i ArtBoris studio och säljs som tryck för privat bruk. ArtBoris kan visa dessa motiv i sitt galleri."
- **Nivå 3 — Gallery** (`/wallcraft/gallery`): Diskret text: "AI-verk skapade i studion kan visas i ArtBoris Gallery."
- **Nivå 4 — Checkout** (`/wallcraft/checkout`): "AI-motiv säljs som tryck för privat bruk enligt våra villkor." (länk till /terms)
- **Extra — Studio:** "Genom att generera ett motiv godkänner du våra villkor." (länk till /terms)
- **i18n:** `legal.*`-nycklar i en.json + sv.json

### 15. Terms-sida (`/terms`)
- Fullständig villkorssida med 8 sektioner (SV+EN med språkväxlare)
- Sektion 4 (lila highlight): AI-genererade motiv — juridiskt bindande text
- Täcker: allmänt, konto, köp/leverans, AI-motiv, användargenererat innehåll, integritet, ansvarsbegränsning, kontakt

### 16. termsAcceptedAt + termsVersion
- **User-modellen:** `termsAcceptedAt DateTime?`, `termsVersion String?`
- **Register API:** Validerar acceptedTerms, sparar termsAcceptedAt + termsVersion ('2026-02')
- **Register UI:** Skickar acceptedTerms i POST body

### 17. Hero-bild på landningssidan
- CSS-baserad rumsscen med väggkonst, soffa, lampa
- Rotation borttagen efter feedback

### 18. GlobalNav login-knapp
- "Logga in / Konto"-knapp i GlobalNav

### 19. AI-förbättring av konstverksbilder vid uppladdning
- Senaste commit: AI-baserad bildförbättring vid artwork upload

### 20. i18n utbyggt till 5 språk
- **Nya språk:** Tyska (DE), Franska (FR), Nederländska (NL) — utöver befintliga Engelska (EN) + Svenska (SV)
- **Nya filer:** `src/i18n/de.json`, `src/i18n/fr.json`, `src/i18n/nl.json`
- **Uppdaterade:** `src/lib/i18n/index.ts` (Locale-typ + dictionaries), `src/components/ui/LanguageSwitcher.tsx` (5 knappar)
- **Terms-sida:** `/terms` har nu alla 8 sektioner på 5 språk med SV/EN/DE/FR/NL toggle
- **Skalbart:** Nytt språk = 1 JSON-fil + 3 rader kod

### 21. Boris Master Prompt — Fine Art AI Portrait System
- **3 nya Boris-stilar:** `boris-silence` (poetisk, mjukt ljus, beige/ivory, nordisk stillhet), `boris-between` (transformation, dimma, kontrast warm/cool), `boris-awakening` (dramatiskt gyllene sidoljus, svart bakgrund)
- **Master prompt-bas:** Delas av alla tre — `androgynous portrait, timeless face, calm presence, fine art photography, soft sculptural light, ultra high detail skin, medium format look, gallery quality, museum print...`
- **Negative prompt-stöd:** Nytt fält `negativePrompt` i `StyleDefinition` — blockerar leenden, tänder, busy backgrounds, fashion makeup etc.
- **Flux-dev för Boris:** Boris-stilar använder `flux-dev` (bättre kvalitet, stöder negative prompt) istället för `flux-schnell`. Vanliga 18 stilar kvar på schnell.
- **Print-modifiers:** Nytt fält `printModifier` — Hahnemühle-textur, matte yta, filmkorn. Läggs till vid slutrender (`buildFinalRenderPrompt`).
- **Variation hints:** Nytt fält `variationHints` — `["double exposure feeling", "light passing through skin", "ethereal atmosphere"]`. Slumpmässigt tillagt vid shuffle/refine.
- **Boris Collection UI:** Egen sektion med guldkant/amber-styling i StylePicker, ovanför de vanliga 18 stilarna med "Fine Art" badge.
- **Bakåtkompatibelt:** Alla nya fält optional, befintliga stilar opåverkade.
- **Filer:** `types/design.ts`, `lib/prompts/styles.ts`, `lib/prompts/templates.ts`, `server/services/ai/generatePreview.ts`, `server/services/ai/refinePreview.ts`, `components/poster/StylePicker.tsx`

### 22. i18n — internationalisera alla kundnära komponenter
- **Commit:** `d8c8b01`
- **useTranslation safe fallback:** `useTranslation()` kastar inte längre utan I18nProvider — returnerar fallback med localStorage-locale
- **5 nya i18n-sektioner** i alla 5 språkfiler (en/sv/de/fr/nl):
  - `boris.*` — 17 nycklar (chat UI, felmeddelanden, action-texter, artChat)
  - `market.*` — 20 nycklar (detaljsida, checkout, "prova på vägg")
  - `artist.*` — 30 nycklar (portal, login, register, dashboard, upload, Stripe)
  - `posterLab.*` — 10 nycklar (result, design, navigation)
  - `order.*` — 3 nycklar (sending, confirmation, sent)
- **Komponenter uppdaterade med `t()`:**
  - `BorisButton.tsx`, `BorisArtChat.tsx`
  - `poster-lab/result/page.tsx`, `poster-lab/design/[id]/page.tsx`, `PosterLabClient.tsx`
  - `market/[id]/ListingClient.tsx`, `market/artist/page.tsx`
  - `order/success/page.tsx`
- **STATUS_LABELS refaktorerad:** → `STATUS_COLORS` + `STATUS_KEYS` för dynamisk i18n i artist-dashboard

### 23. Demo-rum förbättrat — inzoomat, större tavla, skippa väggmarkering
- **Commit:** `eaa2d4f`
- **SVG redesignad:** `room-sample.svg` viewBox zoomad in (`150 60 900 480`) — väggen tar ~85% av bilden
  - Tillagda detaljer: väggtextur, taklist, soffben, pläd, frodigare växt, lampglöd
  - Borttaget: golv/matta/tak-utrymme
- **Tavlan ~25% större:** `ASSUMED_WALL_WIDTH_CM` sänkt 200→160 i `transform.ts`
- **DEMO_WALL_CORNERS:** Fördefinierade vägg-hörn i `lib/demo/demoImages.ts`
- **Skippar väggmarkering:** Alla 4 demo-rum-flöden sätter corners automatiskt:
  - poster-lab → hoppar till pick-style
  - wallcraft/studio → hoppar till pick-style
  - wallcraft/print-your-own → pre-fyller corners
  - market/[id] → hoppar direkt till preview

### 24. Prompt Safety — false positive fix
- **Commit:** `7db2959`
- **BLOCKED_TERMS → BLOCKED_PATTERNS:** Bytte från `includes()` till regex med `\b` word boundaries
- **Fixar:** "what" matchade inte längre "hat", "skilled" matchade inte "kill" etc.
- **sanitizePrompt:** Uppdaterad att använda BLOCKED_PATTERNS
- **Fil:** `src/lib/prompts/safety.ts`

### 25. Boris AI quick-generate knappar
- **Commit:** `7db2959` (wallcraft) + `5525049` (poster-lab)
- **Wallcraft:** "Boris skapar åt dig"-knapp i Creative Tools-sektionen — slumpar stil, genererar 4 varianter, navigerar till resultat
- **Poster Lab:** Boris-knapp under "Se den på min vägg" i hero — visar kostnad (5 credits) + signup-prompt (20 gratis credits)
- **Filer:** `WallcraftClient.tsx`, `PosterLabClient.tsx`

### 26. Internationalisering av startsidan
- **Commit:** `9d188fa`
- **LanguageSwitcher** tillagd i nav (desktop + mobil) på `/` (page.tsx)
- **~50 hårdkodade svenska strängar** ersatta med `t()`-anrop
- **`home.*` i18n-nycklar** i alla 5 språkfiler (en/sv/de/fr/nl)
- **Sektioner:** nav, hero, trust strip, steg, funktioner, Boris-showcase, väggförhandsvisning, konstnärs-CTA, registrering, footer
- **Refaktor:** FEATURES/STEPS → FEATURE_META + FEATURE_ICONS för att kunna använda `t()` inuti komponenten
- **Filer:** `src/app/page.tsx`, `src/i18n/{en,sv,de,fr,nl}.json`

### 27. Akrylglas + Passepartout tillval i checkout
- **Commit:** `1c73c82`
- **Prisma:** `acrylicGlass Boolean @default(false)` tillagd i `OrderItem`
- **Addon-priser per storlek:** Akrylglas 149–349 kr, Passepartout 79–149 kr
- **prints.ts:** `ACRYLIC_PRICES_SEK`, `MAT_PRICES_SEK`, `getAddonPrice()` — storleksbaserade priser
- **calculatePrintPrice + calculateServerPrice:** Utökade med `options?: { matEnabled, acrylicGlass }`
- **CartItem:** Nya fält `matEnabled`, `acrylicGlass`, `matPriceSEK`, `acrylicPriceSEK`
- **CartContext:** `updateItemAddons()` för live-toggle i checkout
- **Checkout UI:** Toggle-knappar med pris + beskrivning per item, kundsupport-block med e-postlänk
- **Ordersammanfattning:** Visar valda tillval ("Akrylglas + Passepartout")
- **API checkout:** Skickar `matEnabled` + `acrylicGlass` till server, sparar i OrderItem
- **Server-side prisvalidering:** Inkluderar tillval i beräkningen
- **Kombinerbart:** Båda tillval kan väljas samtidigt
- **Filer:** `prisma/schema.prisma`, `src/lib/pricing/prints.ts`, `src/lib/cart/CartContext.tsx`, `src/app/api/checkout/route.ts`, `src/app/wallcraft/checkout/page.tsx`, `src/app/wallcraft/design/[id]/page.tsx`

### 28. Auto-detect språk + välkomst-språkväljare
- **Commit:** `b423257`
- **detectLocale():** Läser `localStorage` → `navigator.language` → mappar till stödd locale (sv/en/de/fr/nl)
- **I18nProvider i Providers.tsx:** Global provider med auto-detect, alla sidor får rätt språk
- **LocaleWelcome:** Fullscreen välkomst-banner vid första besök — visar flaggor + "Välkommen" på alla 5 språk
- **Filer:** `src/lib/i18n/index.ts`, `src/components/Providers.tsx`, `src/components/ui/LocaleWelcome.tsx`, `src/app/wallcraft/layout.tsx`

### 29. Kreativa verktyg — fix save-flöde
- **Commit:** `24bb535`
- **Problem:** Colorfield, Mandala, Abstract, Pattern använde `/api/designs/generate` (AI-endpoint) för att spara manuella canvas-verk → slösade Replicate-credits + kunde misslyckas
- **Fix:** Alla 4 verktyg använder nu `/api/designs/create-from-upload` med `style` och `title`
- **create-from-upload utökad:** Accepterar `customStyle` och `customTitle` i request body
- **Filer:** `src/app/wallcraft/{colorfield,mandala,abstract,pattern}/page.tsx`, `src/app/api/designs/create-from-upload/route.ts`

### 30. Ta bort design — DELETE endpoint + bekräftelse-modal
- **Commit:** `3945e68`
- **API:** `DELETE /api/designs/[id]` — ownership-check via `getUserId()`, cascade-delete av varianter
- **UI:** "Ta bort design"-knapp i sidebar + bekräftelse-modal med varning om permanent radering
- **Redirect:** Till `/wallcraft` efter lyckad borttagning
- **Filer:** `src/app/api/designs/[id]/route.ts`, `src/app/wallcraft/design/[id]/page.tsx`

### 31. Safety check debug + Vercel deploy-fix
- **Commits:** `fc61ab9`, `da280dd`, `1855a1f`
- **Problem:** Alla AI-genereringar blockerades på production med "Prompten innehåller otillåtet innehåll" — men lokalt fungerade allt
- **Orsak:** Vercel auto-deploy hade slutat fungera — production körde gammal kod
- **Lösning:** `vercel --prod` via CLI tvingade deploy av senaste koden
- **Verifierat:** Replicate API fungerar (HTTP 200), safety check passerar alla normala prompter lokalt, 4 varianter genereras korrekt

### 32. "Eget verk"-flik i Wallcraft Studio
- **Commit:** `441e3aa`
- **Ny toggle i steg 3:** "✨ AI-generera" / "📷 Eget verk"
- **AI-läge:** Befintligt flöde (StylePicker → Boris → textarea → generera)
- **Upload-läge:** PrintYourOwn-komponent med DPI-analys → skapar design via `create-from-upload` med rum + väggkoordinater → redirect till design-editor
- **Fil:** `src/app/wallcraft/studio/page.tsx`

### 33. Boris M — Maskinist & Omvärldsbevakare
- **Commits:** `57ff58f`, `3561cfd`
- **Prisma-modeller:** `TelemetryEvent`, `BorisMemory` (INCIDENT/UX_LEARNING/PATTERN), `BorisInsight`
- **Telemetri-klient:** `src/lib/boris/telemetry.ts` — batched event tracking (3s intervall, max 20/batch), session/device/locale auto-detect
- **Hook:** `src/hooks/useTelemetry.ts` — auto PAGE_VIEW + funnel/error/slow helpers
- **Instrumenterade sidor:** Studio (UPLOAD_ROOM, GENERATE_ART, UPLOAD_OWN_ARTWORK), Design editor (ADD_TO_CART), Checkout (START_CHECKOUT, CHECKOUT_FAIL)
- **Auto-incident:** `src/lib/boris/autoIncident.ts` — `borisLogIncident()` + `borisLogLearning()`, deduplisering 24h
- **Integrerat i:** `/api/designs/generate` + `/api/checkout` (loggar automatiskt vid fel)
- **API:er (alla admin-skyddade via x-admin-key):**
  - `POST/GET /api/boris/telemetry` — batch-insert + query events
  - `GET /api/boris/funnel` — funnel-analys med drop-off per steg, segmenterat device/locale
  - `GET/POST/PATCH /api/boris/memory` — CRUD för Boris minne
  - `GET/POST/PATCH /api/boris/insights` — CRUD för insights
  - `GET /api/boris/trends` — försäljningsdata, stilar, storlekar, konverteringsmetrik
  - `GET /api/boris/report` — veckorapport med rekommendationer
- **Admin dashboard:** `/admin/boris` — 6 flikar:
  - 📊 Funnel — konverteringstratt med drop-off-bars
  - 📡 Events — event-fördelning
  - 📈 Trends — intäkter, bästsäljare, populäraste storlekar, AI vs upload
  - 💡 Insights — flow doctor insights med status/risk
  - 🧠 Memory — incidenter, UX-lärdomar, patterns
  - 📋 Rapport — veckosammanfattning, rekommendationer, felöversikt

### 34. Boris M Chat — Konversations-AI för admin
- **Commits:** `835084f` → `0a9cc81`
- **API:** `POST /api/boris/chat` — samlar live-data (försäljning, funnel, fel, incidenter, insights senaste 7 dagar), bygger system prompt, skickar till GPT via `borisChat()`
- **UI:** `src/components/boris/BorisChatPanel.tsx` — flytande 🔧-knapp nere till höger, öppnar chattmodal
- **Bara admin:** Renderas bara om `admin_secret` finns i localStorage (pollar varje sekund)
- **Konversationshistorik:** Max 10 turns skickas med
- **System prompt:** Innehåller live intäkter, funnel-steg, felantal, olösta incidenter, populäraste stilar
- **Integrerad i:** Root layout (`src/app/layout.tsx`)
- **Boris Dashboard flyttad:** `/admin/boris` → `/boris` (undviker admin layout auth-block)
- **Hemlig ingång:** 5 snabba klick på "by Artboris" i headern → navigerar till `/boris`
- **GlobalNav:** `/boris` tillagd i `hiddenPrefixes`
- **ADMIN_SECRET:** Satt till `boris-admin-2024` i Vercel env vars
- **Env var:** `ADMIN_SECRET` — krävs för Boris dashboard + chat API
- **Fixar:** Osynlig text i inputfält + selects (explicit `text-gray-900`), tomma-tillstånd för alla flikar

### 35. Auth borttagen från Boris (temporärt)
- **Commits:** `e94d67a` (föregående session)
- **checkAdmin** borttagen från alla 7 Boris API-routes (chat, funnel, telemetry, memory, insights, trends, report)
- **Dashboard login** borttagen — renderar direkt utan inloggning
- **BorisChatPanel** — ingen admin_secret-polling, ingen x-admin-key header, alltid synlig
- **debug-auth endpoint** raderad
- **Allt sparat i minnet** för enkel återställning (memory ID: af5c9532)

### 36. AI-konst — tydligare knapp + skapa från motiv
- **Commits:** `7542120`, `db484c1`
- **Hero:** Lila "Skapa AI-konst"-knapp med sparkle-ikon i hero-sektionen (gradient purple→fuchsia)
- **Creative Tools kompaktare:** Boris-kortet och Design Studio-kortet nedskalade till samma storlek som övriga kort (borttagen sm:col-span-2)
- **Galleri:** "Skapa ny konst från detta"-knapp på varje AI-motiv (hover-overlay, stopPropagation)
- **Design-sida:** Lila "Skapa ny konst från detta motiv"-knapp i sidopanelen
- **Ny sida `/wallcraft/create`:** Två lägen:
  - **Med motiv (img2img):** Visar original, slider "hur mycket ska ändras" (promptStrength 0.3–0.9), stilval, beskrivning
  - **Utan motiv:** "Boris skapar åt dig" + stilval + beskrivning
- **Filer:** `WallcraftClient.tsx`, `GalleryClient.tsx`, `design/[id]/page.tsx`, `create/page.tsx`

### 37. Köp Credits-sida
- **Commit:** `7571f9d`
- **Ny sida `/wallcraft/credits`:** Dedikerad köp-sida med:
  - Aktuellt saldo + dagliga gratis-genereringar
  - 3 paket: Start (100 cr / 129 kr), Populär (300 cr / 299 kr), Pro (1000 cr / 799 kr)
  - Bonus-banner: +20 credits vid första köpet
  - Prislista per funktion (Boris-analys 15 cr, rum+rådgivning 10 cr, AI-konst 5 cr, etc.)
  - Stripe checkout vid klick
- **Nav:** "Credits"-länk i desktop-nav + mobilmeny
- **CreditBadge:** Klick navigerar nu till `/wallcraft/credits` (default onClick)
- **Filer:** `credits/page.tsx`, `WallcraftClient.tsx`, `CreditBadge.tsx`

### 38. Passepartout, akrylglas & tillbehör som tillval
- **Commit:** `bb0a3a3`
- **Ny komponent `AddonsPanel.tsx`:** Tillval-panel med checkboxar:
  - **Passepartout** — vit, 79–149 kr beroende på storlek
  - **Akrylglas** — skyddar motivet, 149–349 kr. Kräver ram (disabled utan ram)
  - **Skruvar & plugg** — 49 kr
  - **Skruvmejsel** — 79 kr
- **Pricing utökad:** `ACCESSORY_PRICES_SEK`, `getAccessoryPrice()` i `prints.ts`
- **CartItem utökad:** `screws?`, `screwdriver?`, `accessoriesPriceSEK?`
- **Design-sida:** AddonsPanel i sidopanelen, prissammanställning visar alla tillval, grandTotal inkl. tillbehör
- **Checkout-knappar:** Visar grandTotal (poster + ram + passepartout + akrylglas + tillbehör)
- **Filer:** `AddonsPanel.tsx`, `prints.ts`, `CartContext.tsx`, `design/[id]/page.tsx`

### 39. Admin-sektion (NextAuth + role-check)
- **Commits:** `37730cb`, `cfdce87`, `f236261`
- **Auth:** NextAuth JWT med role-check i `/admin/layout.tsx` (ADMIN krävs)
- **Seed:** `POST /api/admin/seed` (kräver ADMIN_SECRET) — sätter admin-roll
- **Layout:** `AdminShell.tsx` — sidebar med collapsible nav
- **Sidor:** Dashboard, Art Scanner, Boris M, Ordrar, Market-ordrar, Granskningar, Prissättning, Inbjudningar
- **Boris/Scanner borttagna från publik vy** — redirectar till `/admin/*`

### 40. Premium startsida — digital galleri-upplevelse
- **Commits:** `5415f44`, `82cb4fa`, `bfb16da`, `2dfd790`
- **Ny page.tsx:** HeroSection, TrustBar, CuratedGallery, WallcraftBlock, ArtistBlock, BorisCuration, Footer
- **Playfair Display** serif font via `next/font/google` i layout.tsx
- **Hero:** Hämtar featured listing som bakgrundsbild via `next/image` med `priority`
- **Curated Gallery:** `?featured=1` API — quality score sorting
- **Quality score:** `printQuality_rank × 100 + tryOnWallCount × 10 + log10(views+1) × 10`
- **next.config.ts:** `remotePatterns` för Vercel Blob + Unsplash
- **Copy:** Premium svenskt galleri-språk, sektionslabels, Boris editorial quote

### 41. Auto-publicering + AI-upscale + alla storlekar valbara
- **Commits:** `9664347`, `64c4d6f`, `ff79e34`
- **Auto-publicering:** Alla uploads → `reviewStatus: APPROVED, isPublic: true` direkt. Admin tar bort manuellt via "Ta bort från galleri"-knapp i `/admin/reviews`
- **AI-upscale i printOptimize:** Bilder under 1500px upscalas automatiskt via Replicate Real-ESRGAN (2× eller 4×) istället för att kastas
- **Alla storlekar valbara:** SizePicker blockerar inte längre `low` DPI — visar lila "AI"-badge istället
- **Design editor:** Röd "för låg upplösning"-varning ersatt med lila "✨ AI-uppskalning ingår"
- **Fix:** Skräptext (Boris-rapport) borttagen från `CreativePartnership.tsx`

### 42. Demo-rum redesignat
- **Commit:** `bf71c1f`
- **room-sample.svg:** Stor soffa ersatt med liten stol + sidobord mot väggen
- **Väggen dominerar** ~85% av scenen — bättre för att visa konst
- **Behåller:** Lampa, växt (nu på bordet), väggtextur, taklist, golvlist

### 43. Google OAuth + Admin-åtkomst konfigurerat
- **Google Cloud Console:** Projekt "Boris Run", OAuth client "Web client 2"
  - JS origins: `https://artboris.vercel.app`
  - Redirect URI: `https://artboris.vercel.app/api/auth/callback/google`
- **Vercel env vars (production):** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` — alla satta
- **Admin-åtkomst:**
  - URL: `https://artboris.vercel.app/admin`
  - Kräver Google-login med `mhg10mhg@gmail.com` + ADMIN-roll i DB
  - Seed: `POST /api/admin/seed?secret=artboris-admin-2024` (kör efter första Google-login)
  - `ADMIN_SECRET` = `artboris-admin-2024` (satt på Vercel)

### 44. Formatväljare — stående / liggande / fyrkantigt
- **Prisma:** `aspectRatio String @default("portrait")` tillagd i Design-modellen
- **Typ:** `AspectRatio` typ + `ASPECT_RATIO_MAP` i `types/design.ts` — mappar till Flux aspect_ratio och DALL-E size
- **generatePreview.ts:** Dynamisk `aspect_ratio` (Flux) + `size` (DALL-E) baserat på valt format
- **refinePreview.ts:** Samma dynamiska aspect ratio vid shuffle/refine
- **API routes:** `/api/designs/generate` + `/api/designs/refine` accepterar `aspectRatio` parameter
- **Studio UI:** Visuell formatväljare i steg 3 (AI-läge) — tre knappar med formatikonboxar
- **Create UI:** Samma formatväljare i båda lägen (img2img + utan motiv)
- **Design editor:** Shuffle skickar `aspectRatio` från sparad design
- **Format:** portrait (2:3), landscape (3:2), square (1:1)
- **Bakåtkompatibelt:** Default "portrait" — befintliga designs opåverkade
- **Filer:** `types/design.ts`, `prisma/schema.prisma`, `generatePreview.ts`, `refinePreview.ts`, `api/designs/generate/route.ts`, `api/designs/refine/route.ts`, `wallcraft/studio/page.tsx`, `wallcraft/create/page.tsx`, `wallcraft/design/[id]/page.tsx`

## Kända issues / TODO
- **Admin seed:** Logga in med Google (`mhg10mhg@gmail.com`) först, sedan kör seed-endpointen för att få ADMIN-roll
- Market checkout saknar orderbekräftelse-mejlval (bara Wallcraft + Poster Lab har det)
- Crimson-priser (costSEK) behöver fyllas i efter avtal med Crimson
- Frame-assets är PNG-placeholders, behöver riktiga rambilder

## Git-historik (senaste 20)
```
bf71c1f feat: redesign demo room — small chair + side table replaces large sofa
ff79e34 feat: all sizes selectable — AI upscale handles low DPI
64c4d6f feat: AI upscale small images in printOptimize pipeline (Real-ESRGAN)
9664347 feat: auto-publish uploads, admin 'Ta bort från galleri', fix CreativePartnership
2dfd790 Improved featured score: printQuality×100 + tryOnWall×10 + log10(views+1)×10
bfb16da Mini-polish: quality score, 'Tryckt i Europa', Boris editorial quote
82cb4fa WOW-polish: hero from real listings, next/image, premium copy
5415f44 Redesign homepage: premium gallery experience
f236261 Remove Boris from public, redirect to /admin/boris
cfdce87 Add admin seed endpoint
37730cb Admin dashboard: sidebar layout, scanner moved to admin-only
42f9e82 Image protection: strip imageUrl from public APIs
589739e Boris driftchef-läge
bb0a3a3 feat: passepartout, akrylglas, skruvar & skruvmejsel
7571f9d feat: /wallcraft/credits köp-sida
db484c1 fix: kompaktare Creative Tools-kort
7542120 feat: Skapa AI-konst knapp + /wallcraft/create
e94d67a fix: ta bort all auth från Boris (temporärt)
0a9cc81 fix: synlig text i Boris Dashboard
835084f feat: Boris M Chat — flytande AI-chattpanel
```
