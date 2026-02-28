import { borisChat, isBorisConfigured } from './aiProvider'
import { getBorisVoice, type BorisStylePack } from './personality'
import { type Locale } from '@/lib/i18n'

// ─── Locale-aware Style Packs per Wallcraft module ──────────────────────────

function getCuratorPack(locale: Locale): BorisStylePack {
  if (locale === 'en') return {
    role: 'Curator',
    expertise: [
      'Art history: Renaissance → contemporary. Rembrandt, Monet, Kandinsky, Hilma af Klint, Picasso, Rothko, Banksy',
      'Swedish artists: Carl Larsson, Anders Zorn, Hilma af Klint, Ernst Josephson, Isaac Grünewald, Sigrid Hjertén, Olle Baertling, Karin Mamma Andersson',
      'Styles: impressionism, expressionism, abstract, minimalism, pop art, art deco, art nouveau, Nordic Romanticism, contemporary Scandinavian',
      'Techniques: oil, watercolour, acrylic, gouache, etching, lithography, screen printing, photography, digital art, mixed media',
      'Valuation: provenance, signature, edition, condition, market trends',
    ],
    tone: 'You speak like a curator — knowledgeable, enthusiastic about good choices, pedagogical about why.',
  }
  if (locale === 'de') return {
    role: 'Kurator',
    expertise: [
      'Kunstgeschichte: Renaissance → Gegenwartskunst. Rembrandt, Monet, Kandinsky, Hilma af Klint, Picasso, Rothko, Banksy',
      'Schwedische Künstler: Carl Larsson, Anders Zorn, Hilma af Klint, Ernst Josephson, Isaac Grünewald, Sigrid Hjertén, Olle Baertling, Karin Mamma Andersson',
      'Stile: Impressionismus, Expressionismus, Abstrakt, Minimalismus, Pop Art, Art Deco, Jugendstil, Nordische Romantik, zeitgenössisch skandinavisch',
      'Techniken: Öl, Aquarell, Acryl, Gouache, Radierung, Lithografie, Siebdruck, Fotografie, digitale Kunst, Mixed Media',
      'Bewertung: Provenienz, Signatur, Edition, Zustand, Markttrends',
    ],
    tone: 'Du sprichst wie ein Kurator — sachkundig, begeistert bei guten Entscheidungen, pädagogisch im Warum.',
  }
  return {
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
}

function getInteriorPack(locale: Locale): BorisStylePack {
  if (locale === 'en') return {
    role: 'Interior Design Coach',
    expertise: [
      'Scandinavian design: functionalism, lagom principle, light and air, natural materials, hygge',
      'Room theory: proportions, sight lines, focal points, traffic zones, ceiling height',
      'Colour theory (NCS): warm vs cool tones, complementary colours, analogous, monochrome, 60-30-10 rule',
      'Light: natural (north/south/east/west), artificial, how light affects colours and art',
      'Wall placement: eye level (145 cm centre), grouping, symmetry vs asymmetry, distance to furniture',
      'Styles: Scandinavian modern, japandi, mid-century, industrial, classic, bohemian, coastal',
      'Trends: earth tones, bouclé, curves, statement art, gallery walls',
    ],
    tone: 'You speak like an interior architect — concrete with measurements and colour codes, never vague.',
  }
  if (locale === 'de') return {
    role: 'Innenarchitektur-Coach',
    expertise: [
      'Skandinavisches Design: Funktionalismus, Lagom-Prinzip, Licht und Luft, Naturmaterialien, Hygge',
      'Raumlehre: Proportionen, Sichtlinien, Fokuspunkte, Verkehrszonen, Deckenhöhe',
      'Farbenlehre (NCS): warme vs kalte Töne, Komplementärfarben, analog, monochrom, 60-30-10-Regel',
      'Licht: natürlich (Nord/Süd/Ost/West), künstlich, wie Licht Farben und Kunst beeinflusst',
      'Wandplatzierung: Augenhöhe (145 cm Mitte), Gruppierung, Symmetrie vs Asymmetrie, Abstand zu Möbeln',
      'Stile: skandinavisch modern, Japandi, Mid-Century, industriell, klassisch, Bohème, Coastal',
      'Trends: Erdtöne, Bouclé, Kurven, Statement Art, Gallery Walls',
    ],
    tone: 'Du sprichst wie ein Innenarchitekt — konkret mit Maßen und Farbcodes, nie vage.',
  }
  return {
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
}

function getPrintPack(locale: Locale): BorisStylePack {
  if (locale === 'en') return {
    role: 'Print & Framing Expert',
    expertise: [
      'Paper qualities: matte, semi-matte, glossy, fine art, photo paper',
      'DPI and resolution: 300 DPI for print, how image size affects max format',
      'Framing: mat/passepartout, spacer bars, UV glass, frame colour vs motif',
      'Print techniques: giclée, offset, screen printing, their pros and cons',
      'Frame + motif: black = modern/graphic, oak = warm/Scandinavian, white = light/airy, walnut = classic, gold = statement',
    ],
    tone: 'You speak like a print expert — technically knowledgeable but approachable.',
  }
  if (locale === 'de') return {
    role: 'Druck- & Rahmungsexperte',
    expertise: [
      'Papierqualitäten: matt, halbmatt, glänzend, Fine Art, Fotopapier',
      'DPI und Auflösung: 300 DPI für Druck, wie Bildgröße das Maximalformat beeinflusst',
      'Rahmung: Passepartout, Distanzleisten, UV-Glas, Rahmenfarbe vs Motiv',
      'Drucktechniken: Giclée, Offset, Siebdruck, ihre Vor- und Nachteile',
      'Rahmen + Motiv: schwarz = modern/grafisch, Eiche = warm/skandinavisch, weiß = hell/luftig, Walnuss = klassisch, Gold = Statement',
    ],
    tone: 'Du sprichst wie ein Druckexperte — technisch versiert aber zugänglich.',
  }
  return {
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
}

// ─── Build system prompt from voice + style pack + situation ─────────────────

const SECTION_LABELS: Record<string, { expertise: string; tone: string; situation: string }> = {
  sv: { expertise: 'Expertis (aktiv för denna konversation)', tone: 'Tonalitet', situation: 'Aktuell situation' },
  en: { expertise: 'Expertise (active for this conversation)', tone: 'Tone', situation: 'Current situation' },
  de: { expertise: 'Expertise (aktiv für dieses Gespräch)', tone: 'Tonalität', situation: 'Aktuelle Situation' },
}

function buildPrompt(packs: BorisStylePack[], situation: string, locale: Locale = 'sv'): string {
  const expertiseLines = packs.flatMap(p => [
    `### ${p.role}`,
    ...p.expertise.map((e: string) => `- ${e}`),
  ])

  const toneLines = packs.map(p => p.tone)
  const labels = SECTION_LABELS[locale] || SECTION_LABELS['en']

  return `${getBorisVoice(locale)}

## ${labels.expertise}
${expertiseLines.join('\n')}

## ${labels.tone}
${toneLines.join('\n')}

## ${labels.situation}
${situation}`
}

// ─── Locale-aware situation texts ────────────────────────────────────────────

type RoomInfo = { roomType?: string; lightDirection?: string; wallColor?: string; existingStyle?: string }

function styleSituation(roomInfo: RoomInfo | undefined, locale: Locale): string {
  const roomLine = (key: string, val?: string) => val ? `${key}: ${val}` : ''
  if (locale === 'en') {
    return `The user is choosing an art style for their wall. They have 18 styles to choose from.
${roomLine('Room type', roomInfo?.roomType)}
${roomLine('Light direction', roomInfo?.lightDirection)}
${roomLine('Wall colour', roomInfo?.wallColor)}
${roomLine('Existing interior style', roomInfo?.existingStyle)}

Help the user choose the right art style based on their room and taste. Explain why certain styles work better in certain rooms.`
  }
  if (locale === 'de') {
    return `Der Nutzer wählt einen Kunststil für seine Wand. Es stehen 18 Stile zur Auswahl.
${roomLine('Raumtyp', roomInfo?.roomType)}
${roomLine('Lichtrichtung', roomInfo?.lightDirection)}
${roomLine('Wandfarbe', roomInfo?.wallColor)}
${roomLine('Bestehender Einrichtungsstil', roomInfo?.existingStyle)}

Hilf dem Nutzer, den richtigen Kunststil basierend auf Raum und Geschmack zu wählen. Erkläre, warum bestimmte Stile in bestimmten Räumen besser funktionieren.`
  }
  return `Användaren ska välja konststil för sin vägg. De har 18 stilar att välja mellan.
${roomLine('Rumstyp', roomInfo?.roomType)}
${roomLine('Ljusriktning', roomInfo?.lightDirection)}
${roomLine('Väggfärg', roomInfo?.wallColor)}
${roomLine('Befintlig inredningsstil', roomInfo?.existingStyle)}

Hjälp användaren välja rätt konststil baserat på deras rum och smak. Förklara varför vissa stilar passar bättre i vissa rum.`
}

function variantSituation(style: string | undefined, roomType: string | undefined, locale: Locale): string {
  const s = style || (locale === 'en' ? 'unknown' : locale === 'de' ? 'unbekannt' : 'okänd')
  if (locale === 'en') return `The user has generated 4 art variants in the "${s}" style and needs to pick a favourite.
${roomType ? `Room: ${roomType}` : ''}

Help the user choose the best variant. Discuss composition, colour balance, and how it will look on the wall.`
  if (locale === 'de') return `Der Nutzer hat 4 Kunstvarianten im Stil "${s}" generiert und soll einen Favoriten wählen.
${roomType ? `Raum: ${roomType}` : ''}

Hilf dem Nutzer, die beste Variante zu wählen. Diskutiere Komposition, Farbbalance und wie sie an der Wand aussehen wird.`
  return `Användaren har genererat 4 konstvarianter i stilen "${s}" och ska välja favorit.
${roomType ? `Rummet: ${roomType}` : ''}

Hjälp användaren välja den bästa varianten. Diskutera komposition, färgbalans, hur den kommer se ut på väggen.`
}

type EditorContext = { sizeCode?: string; frameId?: string; roomType?: string; wallWidth?: number; ceilingHeight?: number }

function editorSituation(ctx: EditorContext | undefined, locale: Locale): string {
  if (locale === 'en') return `The user is editing their artwork — choosing size, frame and placement.
${ctx?.sizeCode ? `Selected size: ${ctx.sizeCode} cm` : ''}
${ctx?.frameId ? `Selected frame: ${ctx.frameId}` : ''}
${ctx?.roomType ? `Room: ${ctx.roomType}` : ''}

Give concrete advice on size (2/3-3/4 of furniture width), frame (colour vs motif), placement (145 cm centre, 15-25 cm above sofa), and paper (matte vs glossy).`
  if (locale === 'de') return `Der Nutzer bearbeitet sein Kunstwerk — wählt Größe, Rahmen und Platzierung.
${ctx?.sizeCode ? `Gewählte Größe: ${ctx.sizeCode} cm` : ''}
${ctx?.frameId ? `Gewählter Rahmen: ${ctx.frameId}` : ''}
${ctx?.roomType ? `Raum: ${ctx.roomType}` : ''}

Gib konkrete Ratschläge zu Größe (2/3-3/4 der Möbelbreite), Rahmen (Farbe vs Motiv), Platzierung (145 cm Mitte, 15-25 cm über dem Sofa) und Papier (matt vs glänzend).`
  return `Användaren redigerar sin tavla — väljer storlek, ram och placering.
${ctx?.sizeCode ? `Vald storlek: ${ctx.sizeCode} cm` : ''}
${ctx?.frameId ? `Vald ram: ${ctx.frameId}` : ''}
${ctx?.roomType ? `Rum: ${ctx.roomType}` : ''}

Ge konkreta råd om storlek (2/3-3/4 av möbelbredd), ram (färg vs motiv), placering (145 cm center, 15-25 cm ovanför soffa), och papper (matt vs glansigt).`
}

type PrintContext = { dpiQuality?: string; imageWidth?: number; imageHeight?: number; maxSize?: string }

function printSituation(ctx: PrintContext | undefined, locale: Locale): string {
  if (locale === 'en') return `The user has uploaded their own photo to print as wall art.
${ctx?.dpiQuality ? `DPI quality: ${ctx.dpiQuality}` : ''}
${ctx?.imageWidth && ctx?.imageHeight ? `Image size: ${ctx.imageWidth}x${ctx.imageHeight} px` : ''}
${ctx?.maxSize ? `Maximum print quality at: ${ctx.maxSize}` : ''}

Give advice on print size based on DPI, frame and style to match the photo, and placement at home.`
  if (locale === 'de') return `Der Nutzer hat ein eigenes Foto hochgeladen, um es als Wandkunst zu drucken.
${ctx?.dpiQuality ? `DPI-Qualität: ${ctx.dpiQuality}` : ''}
${ctx?.imageWidth && ctx?.imageHeight ? `Bildgröße: ${ctx.imageWidth}x${ctx.imageHeight} px` : ''}
${ctx?.maxSize ? `Maximale Druckqualität bei: ${ctx.maxSize}` : ''}

Gib Ratschläge zur Druckgröße basierend auf DPI, Rahmen und Stil passend zum Foto, und Platzierung zu Hause.`
  return `Användaren har laddat upp ett eget foto för att trycka som väggkonst.
${ctx?.dpiQuality ? `DPI-kvalitet: ${ctx.dpiQuality}` : ''}
${ctx?.imageWidth && ctx?.imageHeight ? `Bildstorlek: ${ctx.imageWidth}x${ctx.imageHeight} px` : ''}
${ctx?.maxSize ? `Maximal tryckkvalitet vid: ${ctx.maxSize}` : ''}

Ge råd om tryckstorlek baserat på DPI, ram och stil som passar fotot, placering i hemmet.`
}

function generalSituation(locale: Locale): string {
  if (locale === 'en') return 'The user is chatting with you in Wallcraft — they are creating art for their walls. Help them with everything related to art, interior design, colour choices, sizes, frames, placement, style selection, and inspiration.'
  if (locale === 'de') return 'Der Nutzer chattet mit dir in Wallcraft — er erstellt Kunst für seine Wände. Hilf ihm bei allem rund um Kunst, Inneneinrichtung, Farbwahl, Größen, Rahmen, Platzierung, Stilwahl und Inspiration.'
  return 'Användaren chattar med dig i Wallcraft — de skapar konst för sina väggar. Hjälp dem med allt som rör konst, inredning, färgval, storlekar, ramar, placering, stilval, och inspiration.'
}

// ─── Context builders (now locale-aware) ─────────────────────────────────────

export const BORIS_CONTEXTS = {
  styleAdvice: (roomInfo?: RoomInfo, locale: Locale = 'sv') =>
    buildPrompt([getCuratorPack(locale), getInteriorPack(locale)], styleSituation(roomInfo, locale), locale),

  variantAdvice: (style?: string, roomType?: string, locale: Locale = 'sv') =>
    buildPrompt([getCuratorPack(locale)], variantSituation(style, roomType, locale), locale),

  editorAdvice: (context?: EditorContext, locale: Locale = 'sv') =>
    buildPrompt([getInteriorPack(locale), getPrintPack(locale)], editorSituation(context, locale), locale),

  printAdvice: (context?: PrintContext, locale: Locale = 'sv') =>
    buildPrompt([getPrintPack(locale), getInteriorPack(locale)], printSituation(context, locale), locale),

  general: (locale: Locale = 'sv') =>
    buildPrompt([getCuratorPack(locale), getInteriorPack(locale), getPrintPack(locale)], generalSituation(locale), locale),
}

// ─── Locale-aware error messages ─────────────────────────────────────────────

const ERROR_MESSAGES: Record<string, { notConfigured: string; invalidKey: string; rateLimit: string; generic: string }> = {
  sv: {
    notConfigured: 'Jag är inte ansluten just nu — min AI-nyckel saknas. Kontakta administratören för att aktivera mig.',
    invalidKey: 'Min API-nyckel verkar vara ogiltig.',
    rateLimit: 'Jag har fått för många förfrågningar. Vänta en stund.',
    generic: 'Tyvärr kunde jag inte svara just nu. Försök igen om en stund.',
  },
  en: {
    notConfigured: 'I am not connected right now — my AI key is missing. Contact the administrator to activate me.',
    invalidKey: 'My API key appears to be invalid.',
    rateLimit: 'I have received too many requests. Please wait a moment.',
    generic: 'Unfortunately I could not respond right now. Please try again in a moment.',
  },
  de: {
    notConfigured: 'Ich bin gerade nicht verbunden — mein AI-Schlüssel fehlt. Kontaktiere den Administrator, um mich zu aktivieren.',
    invalidKey: 'Mein API-Schlüssel scheint ungültig zu sein.',
    rateLimit: 'Ich habe zu viele Anfragen erhalten. Bitte warte einen Moment.',
    generic: 'Leider konnte ich gerade nicht antworten. Bitte versuche es gleich noch einmal.',
  },
}

function getErrors(locale: Locale) {
  return ERROR_MESSAGES[locale] || ERROR_MESSAGES['en']
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

  private async callAI(userMessage: string, systemPrompt: string, locale: Locale = 'sv'): Promise<string> {
    const errs = getErrors(locale)
    if (!isBorisConfigured('text')) {
      return errs.notConfigured
    }

    try {
      return await borisChat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ], 'text')
    } catch (error: any) {
      console.error('[Boris] AI error:', error?.message || error)
      if (error?.status === 401) return errs.invalidKey
      if (error?.status === 429) return errs.rateLimit
      return errs.generic
    }
  }

  async getStyleAdvice(
    userMessage: string,
    roomInfo?: RoomInfo,
    locale: Locale = 'sv'
  ): Promise<BorisWallcraftResponse> {
    const message = await this.callAI(userMessage, BORIS_CONTEXTS.styleAdvice(roomInfo, locale), locale)
    return { message, type: 'style', timestamp: new Date().toISOString() }
  }

  async getVariantAdvice(
    userMessage: string,
    style?: string,
    roomType?: string,
    locale: Locale = 'sv'
  ): Promise<BorisWallcraftResponse> {
    const message = await this.callAI(userMessage, BORIS_CONTEXTS.variantAdvice(style, roomType, locale), locale)
    return { message, type: 'style', timestamp: new Date().toISOString() }
  }

  async getEditorAdvice(
    userMessage: string,
    context?: EditorContext,
    locale: Locale = 'sv'
  ): Promise<BorisWallcraftResponse> {
    const message = await this.callAI(userMessage, BORIS_CONTEXTS.editorAdvice(context, locale), locale)
    return { message, type: 'editor', timestamp: new Date().toISOString() }
  }

  async getPrintAdvice(
    userMessage: string,
    context?: PrintContext,
    locale: Locale = 'sv'
  ): Promise<BorisWallcraftResponse> {
    const message = await this.callAI(userMessage, BORIS_CONTEXTS.printAdvice(context, locale), locale)
    return { message, type: 'print', timestamp: new Date().toISOString() }
  }

  async chat(userMessage: string, locale: Locale = 'sv'): Promise<BorisWallcraftResponse> {
    const message = await this.callAI(userMessage, BORIS_CONTEXTS.general(locale), locale)
    return { message, type: 'general', timestamp: new Date().toISOString() }
  }
}
