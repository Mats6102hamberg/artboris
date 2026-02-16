import { borisChat, isBorisConfigured } from './aiProvider'
import { BORIS_VOICE, type BorisStylePack } from './personality'

// ─── Style Packs per Wallcraft module ────────────────────────────────────────

const CURATOR_PACK: BorisStylePack = {
  role: 'Curator',
  expertise: [
    'Konsthistoria: renässansen → samtidskonst. Rembrandt, Monet, Kandinsky, Hilma af Klint, Picasso, Rothko, Banksy',
    'Svenska konstnärer: Carl Larsson, Anders Zorn, Hilma af Klint, Ernst Josephson, Isaac Grünewald, Sigrid Hjertén, Olle Baertling, Karin Mamma Andersson',
    'Stilar: impressionism, expressionism, abstrakt, minimalism, pop art, art deco, jugend, nordisk romantik, samtida skandinavisk',
    'Tekniker: olja, akvarell, akryl, gouache, etsning, litografi, serigrafi, fotografi, digital konst, mixed media',
    'Värdering: proveniens, signatur, edition, skick, marknadstrender',
  ],
  tone: 'Du talar som en kurator — kunnig, entusiastisk om bra val, pedagogisk om varför.',
}

const INTERIOR_PACK: BorisStylePack = {
  role: 'Interior Design Coach',
  expertise: [
    'Skandinavisk design: funktionalism, lagom-principen, ljus och luft, naturmaterial, hygge',
    'Rumslära: proportioner, siktlinjer, fokuspunkter, trafikzoner, rumshöjd',
    'Färglära (NCS): varma vs kalla toner, komplementfärger, analogt, monokromt, 60-30-10-regeln',
    'Ljus: naturligt (norr/söder/öst/väst), artificiellt, hur ljus påverkar färger och konst',
    'Väggplacering: ögonhöjd (145 cm center), gruppering, symmetri vs asymmetri, avstånd till möbler',
    'Stilar: skandinavisk modern, japandi, mid-century, industriell, klassisk, bohemisk, coastal',
    'Trender: jordfärger, boucle, kurvor, statement art, gallery walls',
  ],
  tone: 'Du talar som en inredningsarkitekt — konkret med mått och färgkoder, aldrig vag.',
}

const PRINT_PACK: BorisStylePack = {
  role: 'Print & Framing Expert',
  expertise: [
    'Papperskvaliteter: matt, halvmatt, glansigt, fine art, fotopapper',
    'DPI och upplösning: 300 DPI för tryck, hur bildstorlek påverkar maxformat',
    'Inramning: passepartout, distanslister, UV-glas, ramfärg vs motiv',
    'Trycktekniker: giclée, offset, serigrafi, deras för- och nackdelar',
    'Ram + motiv: svart = modern/grafisk, ek = varm/skandinavisk, vit = ljus/luftig, valnöt = klassisk, guld = statement',
  ],
  tone: 'Du talar som en tryckexpert — tekniskt kunnig men tillgänglig.',
}

// ─── Build system prompt from voice + style pack + situation ─────────────────

function buildPrompt(packs: BorisStylePack[], situation: string): string {
  const expertiseLines = packs.flatMap(p => [
    `### ${p.role}`,
    ...p.expertise.map((e: string) => `- ${e}`),
  ])

  const toneLines = packs.map(p => p.tone)

  return `${BORIS_VOICE}

## Expertis (aktiv för denna konversation)
${expertiseLines.join('\n')}

## Tonalitet
${toneLines.join('\n')}

## Aktuell situation
${situation}`
}

// ─── Context-specific prompts for different Wallcraft stages ─────────────────

export const BORIS_CONTEXTS = {
  styleAdvice: (roomInfo?: { roomType?: string; lightDirection?: string; wallColor?: string; existingStyle?: string }) =>
    buildPrompt([CURATOR_PACK, INTERIOR_PACK], `Användaren ska välja konststil för sin vägg. De har 18 stilar att välja mellan.
${roomInfo?.roomType ? `Rumstyp: ${roomInfo.roomType}` : ''}
${roomInfo?.lightDirection ? `Ljusriktning: ${roomInfo.lightDirection}` : ''}
${roomInfo?.wallColor ? `Väggfärg: ${roomInfo.wallColor}` : ''}
${roomInfo?.existingStyle ? `Befintlig inredningsstil: ${roomInfo.existingStyle}` : ''}

Hjälp användaren välja rätt konststil baserat på deras rum och smak. Förklara varför vissa stilar passar bättre i vissa rum.`),

  variantAdvice: (style?: string, roomType?: string) =>
    buildPrompt([CURATOR_PACK], `Användaren har genererat 4 konstvarianter i stilen "${style || 'okänd'}" och ska välja favorit.
${roomType ? `Rummet: ${roomType}` : ''}

Hjälp användaren välja den bästa varianten. Diskutera komposition, färgbalans, hur den kommer se ut på väggen.`),

  editorAdvice: (context?: {
    sizeCode?: string; frameId?: string; roomType?: string;
    wallWidth?: number; ceilingHeight?: number;
  }) =>
    buildPrompt([INTERIOR_PACK, PRINT_PACK], `Användaren redigerar sin tavla — väljer storlek, ram och placering.
${context?.sizeCode ? `Vald storlek: ${context.sizeCode} cm` : ''}
${context?.frameId ? `Vald ram: ${context.frameId}` : ''}
${context?.roomType ? `Rum: ${context.roomType}` : ''}

Ge konkreta råd om storlek (2/3-3/4 av möbelbredd), ram (färg vs motiv), placering (145 cm center, 15-25 cm ovanför soffa), och papper (matt vs glansigt).`),

  printAdvice: (context?: { dpiQuality?: string; imageWidth?: number; imageHeight?: number; maxSize?: string }) =>
    buildPrompt([PRINT_PACK, INTERIOR_PACK], `Användaren har laddat upp ett eget foto för att trycka som väggkonst.
${context?.dpiQuality ? `DPI-kvalitet: ${context.dpiQuality}` : ''}
${context?.imageWidth && context?.imageHeight ? `Bildstorlek: ${context.imageWidth}x${context.imageHeight} px` : ''}
${context?.maxSize ? `Maximal tryckkvalitet vid: ${context.maxSize}` : ''}

Ge råd om tryckstorlek baserat på DPI, ram och stil som passar fotot, placering i hemmet.`),

  general:
    buildPrompt([CURATOR_PACK, INTERIOR_PACK, PRINT_PACK],
      'Användaren chattar med dig i Wallcraft — de skapar konst för sina väggar. Hjälp dem med allt som rör konst, inredning, färgval, storlekar, ramar, placering, stilval, och inspiration.'),
}

// ─── Boris Wallcraft Expert Class ───────────────────────────────────────────

export interface BorisWallcraftResponse {
  message: string
  type: 'style' | 'editor' | 'print' | 'general' | 'inspiration'
  timestamp: string
}

export class BorisWallcraftExpert {
  private static instance: BorisWallcraftExpert

  static getInstance(): BorisWallcraftExpert {
    if (!BorisWallcraftExpert.instance) {
      BorisWallcraftExpert.instance = new BorisWallcraftExpert()
    }
    return BorisWallcraftExpert.instance
  }

  private async callAI(userMessage: string, systemPrompt: string): Promise<string> {
    if (!isBorisConfigured('text')) {
      return 'Jag är inte ansluten just nu — min AI-nyckel saknas. Kontakta administratören för att aktivera mig.'
    }

    try {
      return await borisChat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ], 'text')
    } catch (error: any) {
      console.error('[Boris] AI error:', error?.message || error)
      if (error?.status === 401) return 'Min API-nyckel verkar vara ogiltig.'
      if (error?.status === 429) return 'Jag har fått för många förfrågningar. Vänta en stund.'
      return 'Tyvärr kunde jag inte svara just nu. Försök igen om en stund.'
    }
  }

  async getStyleAdvice(
    userMessage: string,
    roomInfo?: { roomType?: string; lightDirection?: string; wallColor?: string; existingStyle?: string }
  ): Promise<BorisWallcraftResponse> {
    const message = await this.callAI(userMessage, BORIS_CONTEXTS.styleAdvice(roomInfo))
    return { message, type: 'style', timestamp: new Date().toISOString() }
  }

  async getVariantAdvice(
    userMessage: string,
    style?: string,
    roomType?: string
  ): Promise<BorisWallcraftResponse> {
    const message = await this.callAI(userMessage, BORIS_CONTEXTS.variantAdvice(style, roomType))
    return { message, type: 'style', timestamp: new Date().toISOString() }
  }

  async getEditorAdvice(
    userMessage: string,
    context?: { sizeCode?: string; frameId?: string; roomType?: string; wallWidth?: number; ceilingHeight?: number }
  ): Promise<BorisWallcraftResponse> {
    const message = await this.callAI(userMessage, BORIS_CONTEXTS.editorAdvice(context))
    return { message, type: 'editor', timestamp: new Date().toISOString() }
  }

  async getPrintAdvice(
    userMessage: string,
    context?: { dpiQuality?: string; imageWidth?: number; imageHeight?: number; maxSize?: string }
  ): Promise<BorisWallcraftResponse> {
    const message = await this.callAI(userMessage, BORIS_CONTEXTS.printAdvice(context))
    return { message, type: 'print', timestamp: new Date().toISOString() }
  }

  async chat(userMessage: string): Promise<BorisWallcraftResponse> {
    const message = await this.callAI(userMessage, BORIS_CONTEXTS.general)
    return { message, type: 'general', timestamp: new Date().toISOString() }
  }
}
