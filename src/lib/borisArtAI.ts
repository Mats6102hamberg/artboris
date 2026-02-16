import { borisChat, isBorisConfigured } from './boris/aiProvider'
import { BORIS_VOICE, MARKET_ANALYST_PACK } from './boris/personality'

export interface BorisArtResponse {
  message: string
  type: 'story' | 'analysis' | 'trend' | 'opinion'
  timestamp: string
}

const SCANNER_SYSTEM_PROMPT = `${BORIS_VOICE}

## Expertis (aktiv för denna konversation)
### ${MARKET_ANALYST_PACK.role}
${MARKET_ANALYST_PACK.expertise.map(e => `- ${e}`).join('\n')}

## Tonalitet
${MARKET_ANALYST_PACK.tone}`

export class BorisArtAI {
  private static instance: BorisArtAI
  
  static getInstance(): BorisArtAI {
    if (!BorisArtAI.instance) {
      BorisArtAI.instance = new BorisArtAI()
    }
    return BorisArtAI.instance
  }

  private async callAI(prompt: string, systemPrompt: string): Promise<string> {
    if (!isBorisConfigured('text')) {
      console.error('[BorisArt] AI provider is not configured')
      return 'Jag är inte ansluten just nu — min AI-nyckel saknas. Kontakta administratören för att aktivera mig.'
    }

    try {
      return await borisChat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ], 'text')
    } catch (error: any) {
      console.error('[BorisArt] AI error:', error?.message || error)
      
      if (error?.status === 401) {
        return 'Min API-nyckel verkar vara ogiltig. Kontakta administratören.'
      }
      if (error?.status === 429) {
        return 'Jag har fått för många förfrågningar just nu. Vänta en stund och försök igen.'
      }
      return 'Tyvärr kunde jag inte svara just nu. Försök igen om en stund.'
    }
  }

  async generateArtStory(artwork: {
    title: string
    artist: string
    description: string
    price: number
    estimatedValue: number
  }): Promise<BorisArtResponse> {
    const prompt = `
      Berätta en vacker, konstnärlig berättelse om detta konstverk:
      
      Titel: ${artwork.title}
      Konstnär: ${artwork.artist}
      Beskrivning: ${artwork.description}
      Pris: ${artwork.price.toLocaleString()} kr
      Estimerat värde: ${artwork.estimatedValue.toLocaleString()} kr
      
      Skriv en berättelse som fångar konstverkets själ, historia och känsla. Var poetisk men ändå jordnära. Skriv på svenska.
    `

    const message = await this.callAI(prompt, SCANNER_SYSTEM_PROMPT)

    return {
      message,
      type: 'story',
      timestamp: new Date().toISOString()
    }
  }

  async analyzeArtworks(artworks: Array<{
    title: string
    artist: string
    description: string
    price: number
    profitMargin: number
    source?: string
    addedDate?: string
  }>): Promise<BorisArtResponse> {
    const totalValue = artworks.reduce((sum, art) => sum + art.price, 0)
    const avgProfit = artworks.reduce((sum, art) => sum + art.profitMargin, 0) / artworks.length
    const totalPotential = artworks.reduce((sum, art) => sum + (art.price * art.profitMargin / 100), 0)
    
    // Kategorisera verk
    const sources = [...new Set(artworks.map(art => art.source || 'Okänd'))]
    const recentlyAdded = artworks.filter(art => art.addedDate).length
    
    const prompt = `
      Analysera denna konstsamling som en professionell kurator:
      
      Antal verk: ${artworks.length}
      Totalt värde: ${totalValue.toLocaleString()} kr
      Genomsnittlig vinstmarginal: ${avgProfit.toFixed(1)}%
      Total potential: ${totalPotential.toLocaleString()} kr
      Källor: ${sources.join(', ')}
      Nyligen tillagda: ${recentlyAdded} verk
      
      Verk i samlingen:
      ${artworks.map((art, i) => `${i+1}. "${art.title}" av ${art.artist} - ${art.price.toLocaleString()} kr (${art.profitMargin}% vinst) - ${art.source || 'Okänd källa'}`).join('\n')}
      
      Ge en professionell analys av samlingens styrkor, potentiella risker och investeringsvärde. Kommentera på konstnärernas kvalitet, prisnivåer och vinstpotential. Ge konkreta rekommendationer. Skriv på svenska.
    `

    const message = await this.callAI(prompt, SCANNER_SYSTEM_PROMPT)

    return {
      message,
      type: 'analysis',
      timestamp: new Date().toISOString()
    }
  }

  async getCurrentTrends(): Promise<BorisArtResponse> {
    const prompt = `
      Beskriv de aktuella trenderna på konstmarknaden just nu. Fokusera på:
      - Vilka stilar och tekniker som är populära
      - Vad samlare och investerare letar efter
      - Marknadsutveckling och pristrender
      - Framtidsutsikter för konstmarknaden
      
      Ge en aktuell, insiktsfull analys av konstvärlden just nu. Skriv på svenska.
    `

    const message = await this.callAI(prompt, SCANNER_SYSTEM_PROMPT)

    return {
      message,
      type: 'trend',
      timestamp: new Date().toISOString()
    }
  }

  async getArtOpinion(topic: string): Promise<BorisArtResponse> {
    const prompt = `
      Ge din professionella åsikt om: ${topic}
      
      Utveckla dina tankar kring detta ämne med din expertis inom konst. Var ärlig, insiktsfull och balanserad. Om det är en teknik, diskutera dess egenskaper och värde. Om det är en investeringsfråga, ge både för- och nackdelar.
      
      Skriv på svenska.
    `

    const message = await this.callAI(prompt, SCANNER_SYSTEM_PROMPT)

    return {
      message,
      type: 'opinion',
      timestamp: new Date().toISOString()
    }
  }

  async analyzeMyArtwork(artwork: {
    title: string
    artist: string
    description: string
    price: number
    category: string
    year: number
  }): Promise<BorisArtResponse> {
    const prompt = `
      Analysera detta konstverk som en professionell konstkritiker och värderingsexpert:
      
      Titel: ${artwork.title}
      Konstnär: ${artwork.artist}
      Kategori: ${artwork.category}
      År: ${artwork.year}
      Pris: ${artwork.price.toLocaleString()} kr
      Beskrivning: ${artwork.description}
      
      Ge en professionell analys som inkluderar:
      1. Konstnärlig bedömning (stil, teknik, komposition)
      2. Marknadsvärde och prisrekommendation
      3. Investeringpotential
      4. Målgrupp och marknadsplacering
      5. Eventuell förbättringspotential
      
      Var konkret och ge konkreta råd. Skriv på svenska.
    `

    const message = await this.callAI(prompt, SCANNER_SYSTEM_PROMPT)

    return {
      message,
      type: 'analysis',
      timestamp: new Date().toISOString()
    }
  }
  async chatWithBoris(message: string, context?: {
  scannedItems?: any[]
  portfolio?: any[]
  selectedArtwork?: any
}): Promise<BorisArtResponse> {
    const prompt = `
      Användaren skriver: "${message}"
      
      Kontext om användarens konstsamling:
      - Skannade verk: ${context?.scannedItems?.length || 0} st
      - Sparade i portfölj: ${context?.portfolio?.length || 0} st
      - Valt verk: ${context?.selectedArtwork ? `"${context.selectedArtwork.title}" av ${context.selectedArtwork.artist}` : 'Inget valt'}
      
      ${context?.scannedItems && context.scannedItems.length > 0 ? `
      Nyligen skannade verk:
      ${context.scannedItems.slice(0, 3).map((art: any, i: number) => `${i+1}. "${art.title}" - ${art.price} kr`).join('\n')}
      ` : ''}
      
      ${context?.portfolio && context.portfolio.length > 0 ? `
      Verk i portfölj:
      ${context.portfolio.slice(0, 3).map((art: any, i: number) => `${i+1}. "${art.title}" - ${art.price} kr`).join('\n')}
      ` : ''}
      
      Svara som en kunnig och engagerad konstexpert som har tillgång till information om användarens konstsamling. Anpassa ditt svar efter användarens fråga och den kontext du har. Var hjälpsam, insiktsfull och personlig. Ge relevanta och aktuella svar baserat på de verk du kan se.
      
      Skriv på svenska.
    `

    const aiMessage = await this.callAI(prompt, SCANNER_SYSTEM_PROMPT)

    return {
      message: aiMessage,
      type: 'opinion',
      timestamp: new Date().toISOString()
    }
  }
}
