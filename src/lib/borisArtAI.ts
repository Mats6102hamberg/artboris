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
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.8,
      })

      return completion.choices[0]?.message?.content || "Tyvärr kunde jag inte generera ett svar just nu."
    } catch (error) {
      console.error('OpenAI API error:', error)
      
      // Fallback till mock om API misslyckas
      return this.getMockResponse(prompt)
    }
  }

  private getMockResponse(prompt: string): string {
    const mockResponses = [
      "Detta är ett fascinerande konstverk som bär på en rik historia och djup mening. Konstnären har med skicklighet fångat en ögonblick som talar till betraktaren på många nivåer.",
      "Jag ser en spännande utveckling i detta verk där traditionella tekniker möter moderna uttryck. Detta skapar en dialog mellan dåtid och nutid.",
      "Konstverket visar en imponerande teknisk skicklighet kombinerat med en stark konstnärlig vision. Detta är ett verk som kommer att tala till betraktaren under lång tid."
    ]
    
    return mockResponses[Math.floor(Math.random() * mockResponses.length)]
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

    const systemPrompt = `Du är BorisArt AI, en erfaren konstkritiker och berättare. Du skriver vackra, insiktsfulla berättelser om konstverk som engagerar och inspirerar. Din ton är varm, kunnig och passionerad.`

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
  }>): Promise<BorisArtResponse> {
    const totalValue = artworks.reduce((sum, art) => sum + art.price, 0)
    const avgProfit = artworks.reduce((sum, art) => sum + art.profitMargin, 0) / artworks.length
    const totalPotential = artworks.reduce((sum, art) => sum + (art.price * art.profitMargin / 100), 0)

    const prompt = `
      Analysera denna konstsamling som en professionell kurator:
      
      Antal verk: ${artworks.length}
      Totalt värde: ${totalValue.toLocaleString()} kr
      Genomsnittlig vinstmarginal: ${avgProfit.toFixed(1)}%
      Total potential: ${totalPotential.toLocaleString()} kr
      
      Verk i samlingen:
      ${artworks.map((art, i) => `${i+1}. "${art.title}" av ${art.artist} - ${art.price.toLocaleString()} kr (${art.profitMargin}% vinst)`).join('\n')}
      
      Ge en professionell analys av samlingens styrkor, potentiella risker och investeringsvärde. Skriv på svenska.
    `

    const systemPrompt = `Du är BorisArt AI, en expert konstkritiker och investeringsrådgivare. Du analyserar konstsamlingar med både konstnärlig och kommersiell insikt. Din analys är balanserad, kunnig och praktisk.`

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

    const systemPrompt = `Du är BorisArt AI, en välkänd konstmarknadsanalytiker med djup kunskap om aktuella trender och utvecklingar. Dina analyser är baserade på aktuell marknadsdata och branschinnsider.`

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

    const systemPrompt = `Du är BorisArt AI, en erfaren konstkritiker och rådgivare. Du ger ärliga, välgrundade åsikter om konstrelaterade ämnen. Din ton är kunnig men tillgänglig, och du strävar efter att hjälpa människor fatta bättre beslut.`

    const message = await this.callOpenAI(prompt, systemPrompt)

    return {
      message,
      type: 'opinion',
      timestamp: new Date().toISOString()
    }
  }

  async chatWithBoris(message: string): Promise<BorisArtResponse> {
    const prompt = `
      Användaren skriver: "${message}"
      
      Svara som en kunnig och engagerad konstexpert. Anpassa ditt svar efter användarens fråga. Var hjälpsam, insiktsfull och personlig. Om användaren frågar om specifika konstverk, trender eller investeringar, ge relevanta och aktuella svar.
      
      Skriv på svenska.
    `

    const systemPrompt = `Du är BorisArt AI, en passionerad konstexpert som älskar att diskutera konst. Du är kunnig om konsthistoria, nuvarande trender, investeringar och tekniker. Din ton är varm, engagerad och lättillgänglig. Du strävar efter att göra konstvärlden mer förståelig och tillgänglig för alla.`

    const aiMessage = await this.callOpenAI(prompt, systemPrompt)

    return {
      message: aiMessage,
      type: 'opinion',
      timestamp: new Date().toISOString()
    }
  }
}
