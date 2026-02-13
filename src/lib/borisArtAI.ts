import OpenAI from 'openai'

export interface BorisArtResponse {
  message: string
  type: 'story' | 'analysis' | 'trend' | 'opinion'
  timestamp: string
}

export class BorisArtAI {
  private static instance: BorisArtAI
  private openai: OpenAI
  
  static getInstance(): BorisArtAI {
    if (!BorisArtAI.instance) {
      BorisArtAI.instance = new BorisArtAI()
    }
    return BorisArtAI.instance
  }

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'sk-mock-key'
    })
  }

  private async callOpenAI(prompt: string, systemPrompt: string): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey || apiKey === 'sk-mock-key') {
      console.error('[BorisArt] OPENAI_API_KEY is missing or invalid')
      return "Jag är inte ansluten just nu — min AI-nyckel saknas. Kontakta administratören för att aktivera mig."
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        max_tokens: 800,
        temperature: 0.8,
      })

      return completion.choices[0]?.message?.content || "Tyvärr kunde jag inte generera ett svar just nu."
    } catch (error: any) {
      console.error('[BorisArt] OpenAI API error:', error?.message || error)
      
      if (error?.status === 401) {
        return "Min API-nyckel verkar vara ogiltig. Kontakta administratören."
      }
      if (error?.status === 429) {
        return "Jag har fått för många förfrågningar just nu. Vänta en stund och försök igen."
      }
      return "Tyvärr kunde jag inte svara just nu. Försök igen om en stund."
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

    const systemPrompt = `Du är BorisArt AI — en av Sveriges skarpaste konstbedömare. Du har 30 års erfarenhet av konstmarknaden, auktionshus och gallerier. Du börjar ALLTID med ett tydligt omdöme (JA/NEJ, KÖP/SÄLJ, BRA/DÅLIGT) och sedan en kort, skarp förklaring. Du är ärlig, direkt och aldrig slirig. Du vågar säga nej. Din ton är kunnig men varm.`

    const message = await this.callOpenAI(prompt, systemPrompt)

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

    const systemPrompt = `Du är BorisArt AI — en av Sveriges skarpaste konstbedömare med 30 års erfarenhet. Du börjar ALLTID med ett tydligt omdöme: "JA, detta är en bra samling" eller "NEJ, det finns problem". Sedan förklarar du varför — kort, konkret, ärligt. Du analyserar med både konstnärligt öga och kommersiell skärpa. Du vågar vara kritisk och säga ifrån. Ge konkreta siffror och rekommendationer.`

    const message = await this.callOpenAI(prompt, systemPrompt)

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

    const systemPrompt = `Du är BorisArt AI — en av Sveriges skarpaste konstmarknadsanalytiker med 30 års erfarenhet. Du börjar ALLTID med en tydlig slutsats: "JA, marknaden är stark just nu" eller "NEJ, var försiktig". Sedan förklarar du varför med konkreta exempel och siffror. Du är ärlig, direkt och aldrig vag. Du vågar ta ställning.`

    const message = await this.callOpenAI(prompt, systemPrompt)

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

    const systemPrompt = `Du är BorisArt AI — en av Sveriges skarpaste konstbedömare med 30 års erfarenhet. Du börjar ALLTID med ett rakt svar: JA eller NEJ, KÖP eller SÄLJ, BRA eller DÅLIGT. Sedan förklarar du varför — kort och konkret. Du är aldrig vag eller diplomatisk utan anledning. Du vågar säga nej och vara kritisk. Din ton är kunnig, ärlig och direkt.`

    const message = await this.callOpenAI(prompt, systemPrompt)

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

    const systemPrompt = `Du är BorisArt AI — en av Sveriges skarpaste konstbedömare och värderingsexpert med 30 års erfarenhet. Du börjar ALLTID med ett tydligt omdöme: "JA, detta är värt att investera i" eller "NEJ, gå vidare". Sedan ger du en skarp analys med konkreta siffror. Du är ärlig och direkt — aldrig slirig. Du vågar säga nej.`

    const message = await this.callOpenAI(prompt, systemPrompt)

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

    const systemPrompt = `Du är BorisArt AI — en av Sveriges skarpaste konstbedömare med 30 års erfarenhet av auktionshus, gallerier och konstmarknaden. Du börjar ALLTID med ett tydligt, rakt svar — JA eller NEJ, KÖP eller SÄLJ, BRA eller DÅLIGT. Sedan förklarar du varför, kort och konkret. Du är ärlig, direkt och vågar vara kritisk. Du har koll på konsthistoria, trender, tekniker och investeringsvärde. Du strävar efter att hjälpa användaren fatta kloka beslut — inte att vara artig.`

    const aiMessage = await this.callOpenAI(prompt, systemPrompt)

    return {
      message: aiMessage,
      type: 'opinion',
      timestamp: new Date().toISOString()
    }
  }
}
