import { borisChat, isBorisConfigured } from './boris/aiProvider'
import { getBorisVoice, getMarketAnalystPack } from './boris/personality'
import { type Locale } from '@/lib/i18n'

export interface BorisArtResponse {
  message: string
  type: 'story' | 'analysis' | 'trend' | 'opinion'
  timestamp: string
}

// ─── Locale-aware system prompt ──────────────────────────────────────────────

function getScannerSystemPrompt(locale: Locale): string {
  const voice = getBorisVoice(locale)
  const pack = getMarketAnalystPack(locale)
  const label = locale === 'de' ? 'Expertise (aktiv für dieses Gespräch)'
    : locale === 'en' ? 'Expertise (active for this conversation)'
    : 'Expertis (aktiv för denna konversation)'
  const toneLabel = locale === 'de' ? 'Tonalität' : locale === 'en' ? 'Tone' : 'Tonalitet'

  return `${voice}

## ${label}
### ${pack.role}
${pack.expertise.map(e => `- ${e}`).join('\n')}

## ${toneLabel}
${pack.tone}`
}

// ─── Locale-aware error messages ─────────────────────────────────────────────

const ERROR_MESSAGES: Record<string, { notConfigured: string; invalidKey: string; rateLimit: string; generic: string }> = {
  sv: {
    notConfigured: 'Jag är inte ansluten just nu — min AI-nyckel saknas. Kontakta administratören för att aktivera mig.',
    invalidKey: 'Min API-nyckel verkar vara ogiltig. Kontakta administratören.',
    rateLimit: 'Jag har fått för många förfrågningar just nu. Vänta en stund och försök igen.',
    generic: 'Tyvärr kunde jag inte svara just nu. Försök igen om en stund.',
  },
  en: {
    notConfigured: 'I am not connected right now — my AI key is missing. Contact the administrator to activate me.',
    invalidKey: 'My API key appears to be invalid. Contact the administrator.',
    rateLimit: 'I have received too many requests right now. Please wait a moment and try again.',
    generic: 'Unfortunately I could not respond right now. Please try again in a moment.',
  },
  de: {
    notConfigured: 'Ich bin gerade nicht verbunden — mein AI-Schlüssel fehlt. Kontaktiere den Administrator, um mich zu aktivieren.',
    invalidKey: 'Mein API-Schlüssel scheint ungültig zu sein. Kontaktiere den Administrator.',
    rateLimit: 'Ich habe gerade zu viele Anfragen erhalten. Bitte warte einen Moment und versuche es erneut.',
    generic: 'Leider konnte ich gerade nicht antworten. Bitte versuche es gleich noch einmal.',
  },
}

function getErrors(locale: Locale) {
  return ERROR_MESSAGES[locale] || ERROR_MESSAGES['en']
}

// ─── Locale-aware prompt templates ───────────────────────────────────────────

function promptTexts(locale: Locale) {
  if (locale === 'en') return {
    generateStory: (a: { title: string; artist: string; description: string; price: number; estimatedValue: number }) => `
Tell a beautiful, artistic story about this artwork:

Title: ${a.title}
Artist: ${a.artist}
Description: ${a.description}
Price: ${a.price.toLocaleString()} SEK
Estimated value: ${a.estimatedValue.toLocaleString()} SEK

Write a story that captures the artwork's soul, history and feeling. Be poetic yet grounded. Write in English.`,

    analyzeArtworks: (count: number, totalValue: number, avgProfit: number, totalPotential: number, sources: string[], recentlyAdded: number, artworksList: string) => `
Analyse this art collection as a professional curator:

Number of works: ${count}
Total value: ${totalValue.toLocaleString()} SEK
Average profit margin: ${avgProfit.toFixed(1)}%
Total potential: ${totalPotential.toLocaleString()} SEK
Sources: ${sources.join(', ')}
Recently added: ${recentlyAdded} works

Works in the collection:
${artworksList}

Provide a professional analysis of the collection's strengths, potential risks and investment value. Comment on the artists' quality, price levels and profit potential. Give concrete recommendations. Write in English.`,

    getCurrentTrends: `
Describe the current trends in the art market right now. Focus on:
- Which styles and techniques are popular
- What collectors and investors are looking for
- Market development and price trends
- Future outlook for the art market

Provide a current, insightful analysis of the art world right now. Write in English.`,

    getArtOpinion: (topic: string) => `
Give your professional opinion on: ${topic}

Develop your thoughts on this topic with your expertise in art. Be honest, insightful and balanced. If it is a technique, discuss its properties and value. If it is an investment question, provide both pros and cons.

Write in English.`,

    analyzeMyArtwork: (a: { title: string; artist: string; description: string; price: number; category: string; year: number }) => `
Analyse this artwork as a professional art critic and valuation expert:

Title: ${a.title}
Artist: ${a.artist}
Category: ${a.category}
Year: ${a.year}
Price: ${a.price.toLocaleString()} SEK
Description: ${a.description}

Provide a professional analysis including:
1. Artistic assessment (style, technique, composition)
2. Market value and price recommendation
3. Investment potential
4. Target audience and market positioning
5. Potential for improvement

Be specific and give concrete advice. Write in English.`,

    chatWithBoris: (message: string, ctx: { scannedCount: number; portfolioCount: number; selectedInfo: string; scannedList: string; portfolioList: string }) => `
The user writes: "${message}"

Context about the user's art collection:
- Scanned works: ${ctx.scannedCount}
- Saved in portfolio: ${ctx.portfolioCount}
- Selected work: ${ctx.selectedInfo}

${ctx.scannedList}
${ctx.portfolioList}

Respond as a knowledgeable and engaged art expert who has access to information about the user's art collection. Adapt your response to the user's question and the context you have. Be helpful, insightful and personal. Give relevant and current answers based on the works you can see.

Write in English.`,
  }

  if (locale === 'de') return {
    generateStory: (a: { title: string; artist: string; description: string; price: number; estimatedValue: number }) => `
Erzähle eine schöne, künstlerische Geschichte über dieses Kunstwerk:

Titel: ${a.title}
Künstler: ${a.artist}
Beschreibung: ${a.description}
Preis: ${a.price.toLocaleString()} SEK
Geschätzter Wert: ${a.estimatedValue.toLocaleString()} SEK

Schreibe eine Geschichte, die die Seele, Geschichte und das Gefühl des Kunstwerks einfängt. Sei poetisch aber bodenständig. Schreibe auf Deutsch.`,

    analyzeArtworks: (count: number, totalValue: number, avgProfit: number, totalPotential: number, sources: string[], recentlyAdded: number, artworksList: string) => `
Analysiere diese Kunstsammlung als professioneller Kurator:

Anzahl Werke: ${count}
Gesamtwert: ${totalValue.toLocaleString()} SEK
Durchschnittliche Gewinnmarge: ${avgProfit.toFixed(1)}%
Gesamtpotenzial: ${totalPotential.toLocaleString()} SEK
Quellen: ${sources.join(', ')}
Kürzlich hinzugefügt: ${recentlyAdded} Werke

Werke in der Sammlung:
${artworksList}

Gib eine professionelle Analyse der Stärken der Sammlung, potenzieller Risiken und des Investitionswerts. Kommentiere die Qualität der Künstler, Preisniveaus und Gewinnpotenzial. Gib konkrete Empfehlungen. Schreibe auf Deutsch.`,

    getCurrentTrends: `
Beschreibe die aktuellen Trends auf dem Kunstmarkt. Fokussiere auf:
- Welche Stile und Techniken beliebt sind
- Wonach Sammler und Investoren suchen
- Marktentwicklung und Preistrends
- Zukunftsaussichten für den Kunstmarkt

Gib eine aktuelle, aufschlussreiche Analyse der Kunstwelt. Schreibe auf Deutsch.`,

    getArtOpinion: (topic: string) => `
Gib deine professionelle Meinung zu: ${topic}

Entwickle deine Gedanken zu diesem Thema mit deiner Expertise in Kunst. Sei ehrlich, aufschlussreich und ausgewogen. Wenn es eine Technik ist, diskutiere ihre Eigenschaften und ihren Wert. Wenn es eine Investitionsfrage ist, nenne Vor- und Nachteile.

Schreibe auf Deutsch.`,

    analyzeMyArtwork: (a: { title: string; artist: string; description: string; price: number; category: string; year: number }) => `
Analysiere dieses Kunstwerk als professioneller Kunstkritiker und Bewertungsexperte:

Titel: ${a.title}
Künstler: ${a.artist}
Kategorie: ${a.category}
Jahr: ${a.year}
Preis: ${a.price.toLocaleString()} SEK
Beschreibung: ${a.description}

Gib eine professionelle Analyse mit:
1. Künstlerische Bewertung (Stil, Technik, Komposition)
2. Marktwert und Preisempfehlung
3. Investitionspotenzial
4. Zielgruppe und Marktpositionierung
5. Verbesserungspotenzial

Sei konkret und gib konkrete Ratschläge. Schreibe auf Deutsch.`,

    chatWithBoris: (message: string, ctx: { scannedCount: number; portfolioCount: number; selectedInfo: string; scannedList: string; portfolioList: string }) => `
Der Nutzer schreibt: "${message}"

Kontext zur Kunstsammlung des Nutzers:
- Gescannte Werke: ${ctx.scannedCount}
- Im Portfolio gespeichert: ${ctx.portfolioCount}
- Ausgewähltes Werk: ${ctx.selectedInfo}

${ctx.scannedList}
${ctx.portfolioList}

Antworte als sachkundiger und engagierter Kunstexperte mit Zugang zu Informationen über die Kunstsammlung des Nutzers. Passe deine Antwort an die Frage und den Kontext an. Sei hilfreich, aufschlussreich und persönlich. Gib relevante und aktuelle Antworten basierend auf den Werken, die du siehst.

Schreibe auf Deutsch.`,
  }

  // Swedish (default)
  return {
    generateStory: (a: { title: string; artist: string; description: string; price: number; estimatedValue: number }) => `
Berätta en vacker, konstnärlig berättelse om detta konstverk:

Titel: ${a.title}
Konstnär: ${a.artist}
Beskrivning: ${a.description}
Pris: ${a.price.toLocaleString()} kr
Estimerat värde: ${a.estimatedValue.toLocaleString()} kr

Skriv en berättelse som fångar konstverkets själ, historia och känsla. Var poetisk men ändå jordnära. Skriv på svenska.`,

    analyzeArtworks: (count: number, totalValue: number, avgProfit: number, totalPotential: number, sources: string[], recentlyAdded: number, artworksList: string) => `
Analysera denna konstsamling som en professionell kurator:

Antal verk: ${count}
Totalt värde: ${totalValue.toLocaleString()} kr
Genomsnittlig vinstmarginal: ${avgProfit.toFixed(1)}%
Total potential: ${totalPotential.toLocaleString()} kr
Källor: ${sources.join(', ')}
Nyligen tillagda: ${recentlyAdded} verk

Verk i samlingen:
${artworksList}

Ge en professionell analys av samlingens styrkor, potentiella risker och investeringsvärde. Kommentera på konstnärernas kvalitet, prisnivåer och vinstpotential. Ge konkreta rekommendationer. Skriv på svenska.`,

    getCurrentTrends: `
Beskriv de aktuella trenderna på konstmarknaden just nu. Fokusera på:
- Vilka stilar och tekniker som är populära
- Vad samlare och investerare letar efter
- Marknadsutveckling och pristrender
- Framtidsutsikter för konstmarknaden

Ge en aktuell, insiktsfull analys av konstvärlden just nu. Skriv på svenska.`,

    getArtOpinion: (topic: string) => `
Ge din professionella åsikt om: ${topic}

Utveckla dina tankar kring detta ämne med din expertis inom konst. Var ärlig, insiktsfull och balanserad. Om det är en teknik, diskutera dess egenskaper och värde. Om det är en investeringsfråga, ge både för- och nackdelar.

Skriv på svenska.`,

    analyzeMyArtwork: (a: { title: string; artist: string; description: string; price: number; category: string; year: number }) => `
Analysera detta konstverk som en professionell konstkritiker och värderingsexpert:

Titel: ${a.title}
Konstnär: ${a.artist}
Kategori: ${a.category}
År: ${a.year}
Pris: ${a.price.toLocaleString()} kr
Beskrivning: ${a.description}

Ge en professionell analys som inkluderar:
1. Konstnärlig bedömning (stil, teknik, komposition)
2. Marknadsvärde och prisrekommendation
3. Investeringpotential
4. Målgrupp och marknadsplacering
5. Eventuell förbättringspotential

Var konkret och ge konkreta råd. Skriv på svenska.`,

    chatWithBoris: (message: string, ctx: { scannedCount: number; portfolioCount: number; selectedInfo: string; scannedList: string; portfolioList: string }) => `
Användaren skriver: "${message}"

Kontext om användarens konstsamling:
- Skannade verk: ${ctx.scannedCount} st
- Sparade i portfölj: ${ctx.portfolioCount} st
- Valt verk: ${ctx.selectedInfo}

${ctx.scannedList}
${ctx.portfolioList}

Svara som en kunnig och engagerad konstexpert som har tillgång till information om användarens konstsamling. Anpassa ditt svar efter användarens fråga och den kontext du har. Var hjälpsam, insiktsfull och personlig. Ge relevanta och aktuella svar baserat på de verk du kan se.

Skriv på svenska.`,
  }
}

// ─── Main Class ──────────────────────────────────────────────────────────────

export class BorisArtAI {
  private static instance: BorisArtAI

  static getInstance(): BorisArtAI {
    if (!BorisArtAI.instance) {
      BorisArtAI.instance = new BorisArtAI()
    }
    return BorisArtAI.instance
  }

  private async callAI(prompt: string, systemPrompt: string, locale: Locale = 'sv'): Promise<string> {
    const errs = getErrors(locale)
    if (!isBorisConfigured('text')) {
      console.error('[BorisArt] AI provider is not configured')
      return errs.notConfigured
    }

    try {
      return await borisChat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ], 'text')
    } catch (error: any) {
      console.error('[BorisArt] AI error:', error?.message || error)
      if (error?.status === 401) return errs.invalidKey
      if (error?.status === 429) return errs.rateLimit
      return errs.generic
    }
  }

  async generateArtStory(artwork: {
    title: string
    artist: string
    description: string
    price: number
    estimatedValue: number
  }, locale: Locale = 'sv'): Promise<BorisArtResponse> {
    const texts = promptTexts(locale)
    const prompt = texts.generateStory(artwork)
    const message = await this.callAI(prompt, getScannerSystemPrompt(locale), locale)
    return { message, type: 'story', timestamp: new Date().toISOString() }
  }

  async analyzeArtworks(artworks: Array<{
    title: string
    artist: string
    description: string
    price: number
    profitMargin: number
    source?: string
    addedDate?: string
  }>, locale: Locale = 'sv'): Promise<BorisArtResponse> {
    const totalValue = artworks.reduce((sum, art) => sum + art.price, 0)
    const avgProfit = artworks.reduce((sum, art) => sum + art.profitMargin, 0) / artworks.length
    const totalPotential = artworks.reduce((sum, art) => sum + (art.price * art.profitMargin / 100), 0)
    const sources = [...new Set(artworks.map(art => art.source || (locale === 'en' ? 'Unknown' : locale === 'de' ? 'Unbekannt' : 'Okänd')))]
    const recentlyAdded = artworks.filter(art => art.addedDate).length

    const artworksList = artworks.map((art, i) =>
      `${i+1}. "${art.title}" ${locale === 'de' ? 'von' : locale === 'en' ? 'by' : 'av'} ${art.artist} - ${art.price.toLocaleString()} ${locale === 'sv' ? 'kr' : 'SEK'} (${art.profitMargin}% ${locale === 'de' ? 'Gewinn' : locale === 'en' ? 'profit' : 'vinst'}) - ${art.source || (locale === 'en' ? 'Unknown source' : locale === 'de' ? 'Unbekannte Quelle' : 'Okänd källa')}`
    ).join('\n')

    const texts = promptTexts(locale)
    const prompt = texts.analyzeArtworks(artworks.length, totalValue, avgProfit, totalPotential, sources, recentlyAdded, artworksList)
    const message = await this.callAI(prompt, getScannerSystemPrompt(locale), locale)
    return { message, type: 'analysis', timestamp: new Date().toISOString() }
  }

  async getCurrentTrends(locale: Locale = 'sv'): Promise<BorisArtResponse> {
    const texts = promptTexts(locale)
    const message = await this.callAI(texts.getCurrentTrends, getScannerSystemPrompt(locale), locale)
    return { message, type: 'trend', timestamp: new Date().toISOString() }
  }

  async getArtOpinion(topic: string, locale: Locale = 'sv'): Promise<BorisArtResponse> {
    const texts = promptTexts(locale)
    const prompt = texts.getArtOpinion(topic)
    const message = await this.callAI(prompt, getScannerSystemPrompt(locale), locale)
    return { message, type: 'opinion', timestamp: new Date().toISOString() }
  }

  async analyzeMyArtwork(artwork: {
    title: string
    artist: string
    description: string
    price: number
    category: string
    year: number
  }, locale: Locale = 'sv'): Promise<BorisArtResponse> {
    const texts = promptTexts(locale)
    const prompt = texts.analyzeMyArtwork(artwork)
    const message = await this.callAI(prompt, getScannerSystemPrompt(locale), locale)
    return { message, type: 'analysis', timestamp: new Date().toISOString() }
  }

  async chatWithBoris(message: string, context?: {
    scannedItems?: any[]
    portfolio?: any[]
    selectedArtwork?: any
  }, locale: Locale = 'sv'): Promise<BorisArtResponse> {
    const noSelection = locale === 'de' ? 'Keins ausgewählt' : locale === 'en' ? 'None selected' : 'Inget valt'
    const selectedInfo = context?.selectedArtwork
      ? `"${context.selectedArtwork.title}" ${locale === 'de' ? 'von' : locale === 'en' ? 'by' : 'av'} ${context.selectedArtwork.artist}`
      : noSelection

    const scannedList = context?.scannedItems && context.scannedItems.length > 0
      ? (locale === 'en' ? 'Recently scanned works:\n' : locale === 'de' ? 'Kürzlich gescannte Werke:\n' : 'Nyligen skannade verk:\n') +
        context.scannedItems.slice(0, 3).map((art: any, i: number) => `${i+1}. "${art.title}" - ${art.price} ${locale === 'sv' ? 'kr' : 'SEK'}`).join('\n')
      : ''

    const portfolioList = context?.portfolio && context.portfolio.length > 0
      ? (locale === 'en' ? 'Works in portfolio:\n' : locale === 'de' ? 'Werke im Portfolio:\n' : 'Verk i portfölj:\n') +
        context.portfolio.slice(0, 3).map((art: any, i: number) => `${i+1}. "${art.title}" - ${art.price} ${locale === 'sv' ? 'kr' : 'SEK'}`).join('\n')
      : ''

    const texts = promptTexts(locale)
    const prompt = texts.chatWithBoris(message, {
      scannedCount: context?.scannedItems?.length || 0,
      portfolioCount: context?.portfolio?.length || 0,
      selectedInfo,
      scannedList,
      portfolioList,
    })

    const aiMessage = await this.callAI(prompt, getScannerSystemPrompt(locale), locale)
    return { message: aiMessage, type: 'opinion', timestamp: new Date().toISOString() }
  }
}
