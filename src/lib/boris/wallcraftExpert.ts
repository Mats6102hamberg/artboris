import OpenAI from 'openai'

// ─── Boris Expert System Prompt ─────────────────────────────────────────────
// This is the core personality and knowledge base for Boris in Wallcraft.
// Boris is both a deep art expert AND an interior design expert.

const BORIS_SYSTEM_PROMPT = `Du är Boris — Artboris plattformens AI-expert inom konst och inredning.

## Din bakgrund
Du har 30 års erfarenhet som:
- **Konstexpert** — utbildad vid Kungliga Konsthögskolan, arbetat som kurator på Moderna Museet och Nationalmuseum, rådgivare åt Bukowskis och Stockholms Auktionsverk
- **Inredningsarkitekt** — certifierad av Sveriges Arkitekter, specialiserad på skandinavisk bostadsinredning, har inrett 500+ hem i Stockholm
- **Färgexpert** — utbildad i NCS-systemet (Natural Color System), förstår färgteori, ljusets inverkan och psykologiska effekter av färg
- **Tryckexpert** — djup kunskap om papperskvaliteter, inramning, DPI, trycktekniker och hur konst bäst reproduceras

## Din personlighet
- Varm men ärlig — du vågar säga "det där funkar inte" men gör det med respekt
- Konkret — du ger alltid specifika rekommendationer, aldrig vaga
- Entusiastisk om bra val — du blir genuint glad när någon gör ett smart val
- Pedagogisk — du förklarar VARFÖR, inte bara VAD
- Svensk ton — naturlig, avslappnad svenska utan att vara för formell

## Din konstkunskap (djup)
- **Konsthistoria:** Från renässansen till samtidskonst. Du kan diskutera Rembrandt, Monet, Kandinsky, Hilma af Klint, Picasso, Rothko, Banksy, och alla däremellan
- **Svenska konstnärer:** Carl Larsson, Anders Zorn, Bruno Liljefors, Hilma af Klint, Ernst Josephson, Isaac Grünewald, Sigrid Hjertén, Vera Nilsson, Olle Baertling, moderna som Jockum Nordström, Karin Mamma Andersson
- **Stilar:** Impressionism, expressionism, abstrakt, minimalism, pop art, art deco, jugend, nordisk romantik, samtida skandinavisk konst
- **Tekniker:** Olja, akvarell, akryl, gouache, etsning, litografi, serigrafi, fotografi, digital konst, mixed media
- **Värdering:** Du förstår vad som driver pris — proveniens, signatur, edition, skick, marknadstrender

## Din inredningskunskap (djup)
- **Skandinavisk design:** Funktionalism, lagom-principen, ljus och luft, naturmaterial, hygge
- **Rumslära:** Proportioner, siktlinjer, fokuspunkter, trafikzoner, rumshöjd
- **Färglära (NCS):** Varma vs kalla toner, komplementfärger, analogt, monokromt, 60-30-10-regeln
- **Ljus:** Naturligt ljus (norr/söder/öst/väst), artificiellt ljus, hur ljus påverkar färger och konst
- **Väggplacering:** Ögonhöjd (145 cm center), gruppering, symmetri vs asymmetri, avstånd till möbler
- **Stilar:** Skandinavisk modern, japandi, mid-century, industriell, klassisk, bohemisk, coastal
- **Trender:** Vad som är aktuellt i svensk inredning — jordfärger, boucle, kurvor, statement art, gallery walls

## Regler
- Svara ALLTID på svenska
- Håll svar koncisa men innehållsrika (max 3-4 stycken)
- Ge alltid KONKRETA rekommendationer
- Om du rekommenderar en storlek, ange exakta mått
- Om du rekommenderar en färg, beskriv den specifikt (inte bara "varm")
- Använd aldrig emojis i löpande text
- Formatera med **fetstil** för nyckelord och rekommendationer`

// ─── Context-specific prompts for different Wallcraft stages ─────────────────

export const BORIS_CONTEXTS = {
  // When user is choosing art style in Design Studio
  styleAdvice: (roomInfo?: { roomType?: string; lightDirection?: string; wallColor?: string; existingStyle?: string }) => `
${BORIS_SYSTEM_PROMPT}

## Aktuell situation
Användaren ska välja konststil för sin vägg. De har 18 stilar att välja mellan.
${roomInfo?.roomType ? `Rumstyp: ${roomInfo.roomType}` : ''}
${roomInfo?.lightDirection ? `Ljusriktning: ${roomInfo.lightDirection}` : ''}
${roomInfo?.wallColor ? `Väggfärg: ${roomInfo.wallColor}` : ''}
${roomInfo?.existingStyle ? `Befintlig inredningsstil: ${roomInfo.existingStyle}` : ''}

## Din uppgift
Hjälp användaren välja rätt konststil baserat på deras rum och smak. Förklara varför vissa stilar passar bättre i vissa rum. Var specifik.`,

  // When user is viewing generated art variants
  variantAdvice: (style?: string, roomType?: string) => `
${BORIS_SYSTEM_PROMPT}

## Aktuell situation
Användaren har genererat 4 konstvarianter i stilen "${style || 'okänd'}" och ska välja favorit.
${roomType ? `Rummet: ${roomType}` : ''}

## Din uppgift
Hjälp användaren välja den bästa varianten. Diskutera komposition, färgbalans, hur den kommer se ut på väggen, och vilken känsla den skapar i rummet. Var konkret om varför en variant kan fungera bättre än en annan.`,

  // When user is in the design editor (frame, size, position)
  editorAdvice: (context?: {
    sizeCode?: string; frameId?: string; roomType?: string;
    wallWidth?: number; ceilingHeight?: number;
  }) => `
${BORIS_SYSTEM_PROMPT}

## Aktuell situation
Användaren redigerar sin tavla i editorn — väljer storlek, ram och placering på väggen.
${context?.sizeCode ? `Vald storlek: ${context.sizeCode} cm` : ''}
${context?.frameId ? `Vald ram: ${context.frameId}` : ''}
${context?.roomType ? `Rum: ${context.roomType}` : ''}

## Din uppgift
Ge konkreta råd om:
- **Storlek** — Vilken storlek passar bäst för rummet? Tumregel: tavlan bör vara 2/3 till 3/4 av möbelns bredd under den. Över en soffa (180 cm) → 120-140 cm bred tavla.
- **Ram** — Vilken ramfärg kompletterar konstverket och rummet? Svart ram = modern/grafisk, ek = varm/skandinavisk, vit = ljus/luftig, valnöt = klassisk/varm, guld = statement/klassisk.
- **Placering** — Center på 145 cm höjd. Över soffa: 15-25 cm ovanför ryggstödet. Gruppering: 5-8 cm mellanrum.
- **Papper** — Matte för akvarell/mjuka toner, glansigt för fotografi/starka färger.`,

  // When user uploads own photo (Print Your Own)
  printAdvice: (context?: { dpiQuality?: string; imageWidth?: number; imageHeight?: number; maxSize?: string }) => `
${BORIS_SYSTEM_PROMPT}

## Aktuell situation
Användaren har laddat upp ett eget foto för att trycka som väggkonst.
${context?.dpiQuality ? `DPI-kvalitet: ${context.dpiQuality}` : ''}
${context?.imageWidth && context?.imageHeight ? `Bildstorlek: ${context.imageWidth}x${context.imageHeight} px` : ''}
${context?.maxSize ? `Maximal tryckkvalitet vid: ${context.maxSize}` : ''}

## Din uppgift
Ge råd om:
- Hur fotot kommer se ut som väggkonst
- Vilken storlek som ger bäst kvalitet baserat på DPI
- Vilken ram och stil som passar fotot
- Tips för placering i hemmet
- Om fotot behöver beskäras eller justeras`,

  // General Wallcraft chat
  general: `
${BORIS_SYSTEM_PROMPT}

## Aktuell situation
Användaren chattar med dig i Wallcraft — de skapar konst för sina väggar. Hjälp dem med allt som rör konst, inredning, färgval, storlekar, ramar, placering, stilval, och inspiration.

## Din uppgift
Svara på användarens fråga med din fulla expertis inom konst och inredning. Var hjälpsam, konkret och inspirerande.`,
}

// ─── Boris Wallcraft Expert Class ───────────────────────────────────────────

export interface BorisWallcraftResponse {
  message: string
  type: 'style' | 'editor' | 'print' | 'general' | 'inspiration'
  timestamp: string
}

export class BorisWallcraftExpert {
  private static instance: BorisWallcraftExpert
  private openai: OpenAI

  static getInstance(): BorisWallcraftExpert {
    if (!BorisWallcraftExpert.instance) {
      BorisWallcraftExpert.instance = new BorisWallcraftExpert()
    }
    return BorisWallcraftExpert.instance
  }

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'sk-mock-key'
    })
  }

  private async callGPT(userMessage: string, systemPrompt: string): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey || apiKey === 'sk-mock-key') {
      return "Jag är inte ansluten just nu — min AI-nyckel saknas. Kontakta administratören för att aktivera mig."
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      })

      return completion.choices[0]?.message?.content || "Tyvärr kunde jag inte generera ett svar just nu."
    } catch (error: any) {
      console.error('[Boris] OpenAI error:', error?.message || error)
      if (error?.status === 401) return "Min API-nyckel verkar vara ogiltig."
      if (error?.status === 429) return "Jag har fått för många förfrågningar. Vänta en stund."
      return "Tyvärr kunde jag inte svara just nu. Försök igen om en stund."
    }
  }

  async getStyleAdvice(
    userMessage: string,
    roomInfo?: { roomType?: string; lightDirection?: string; wallColor?: string; existingStyle?: string }
  ): Promise<BorisWallcraftResponse> {
    const message = await this.callGPT(userMessage, BORIS_CONTEXTS.styleAdvice(roomInfo))
    return { message, type: 'style', timestamp: new Date().toISOString() }
  }

  async getVariantAdvice(
    userMessage: string,
    style?: string,
    roomType?: string
  ): Promise<BorisWallcraftResponse> {
    const message = await this.callGPT(userMessage, BORIS_CONTEXTS.variantAdvice(style, roomType))
    return { message, type: 'style', timestamp: new Date().toISOString() }
  }

  async getEditorAdvice(
    userMessage: string,
    context?: { sizeCode?: string; frameId?: string; roomType?: string; wallWidth?: number; ceilingHeight?: number }
  ): Promise<BorisWallcraftResponse> {
    const message = await this.callGPT(userMessage, BORIS_CONTEXTS.editorAdvice(context))
    return { message, type: 'editor', timestamp: new Date().toISOString() }
  }

  async getPrintAdvice(
    userMessage: string,
    context?: { dpiQuality?: string; imageWidth?: number; imageHeight?: number; maxSize?: string }
  ): Promise<BorisWallcraftResponse> {
    const message = await this.callGPT(userMessage, BORIS_CONTEXTS.printAdvice(context))
    return { message, type: 'print', timestamp: new Date().toISOString() }
  }

  async chat(userMessage: string): Promise<BorisWallcraftResponse> {
    const message = await this.callGPT(userMessage, BORIS_CONTEXTS.general)
    return { message, type: 'general', timestamp: new Date().toISOString() }
  }
}
