export interface BorisArtResponse {
  message: string
  type: 'story' | 'analysis' | 'trend' | 'opinion'
  timestamp: string
}

export class BorisArtAI {
  private static instance: BorisArtAI
  
  static getInstance(): BorisArtAI {
    if (!BorisArtAI.instance) {
      BorisArtAI.instance = new BorisArtAI()
    }
    return BorisArtAI.instance
  }

  async generateArtStory(artwork: {
    title: string
    artist: string
    description: string
    price: number
    estimatedValue: number
  }): Promise<BorisArtResponse> {
    // Simulera AI-tänkande
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const stories = [
      `I "${artwork.title}" av ${artwork.artist} ser jag en fascinerande berättelse om tid och rum. Konstnären har med ${artwork.description.toLowerCase()} skapat ett verk som andas av både nostalgi och modernitet. Priset på ${artwork.price.toLocaleString()} kr reflekterar verkligen dess konstnärliga värde, med en estimerad potential på ${artwork.estimatedValue.toLocaleString()} kr. Detta är ett verk som skulle berätta historier i generationer.`,
      
      `"${artwork.title}" fångar essensen av ${artwork.artist}s unika vision. Med ${artwork.description.toLowerCase()} som medium, har konstnären lyckats förmedla en känsla som är både tidlös och samtida. Det är intressant att notera hur marknaden värderar detta verk till ${artwork.price.toLocaleString()} kr, med en potentiell uppsida på ${artwork.estimatedValue.toLocaleString()} kr. En sann investering i både konstnärlig och ekonomisk mening.`,
      
      `När jag betraktar "${artwork.title}" av ${artwork.artist}, slås jag av den subtila balansen mellan tradition och innovation. ${artwork.description} som medium ger verket en speciell textur och djup. Med ett nuvarande pris på ${artwork.price.toLocaleString()} kr och ett estimerat värde på ${artwork.estimatedValue.toLocaleString()} kr, är detta ett exemplar på hur kvalitetskonst behåller sitt värde över tid.`
    ]
    
    return {
      message: stories[Math.floor(Math.random() * stories.length)],
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
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const totalValue = artworks.reduce((sum, art) => sum + art.price, 0)
    const avgProfit = artworks.reduce((sum, art) => sum + art.profitMargin, 0) / artworks.length
    const totalPotential = artworks.reduce((sum, art) => sum + (art.price * art.profitMargin / 100), 0)
    
    const analyses = [
      `Din samling på ${artworks.length} verk visar en imponerande kuraterad vision. Med ett totalt värde på ${totalValue.toLocaleString()} kr och en genomsnittlig vinstpotential på ${avgProfit.toFixed(1)}%, har du identifierat verk med stark marknadspotential. Särskilt noterbart är hur du balanserar etablerade konstnärer med nya talanger. Total investeringspotential ligger på ${totalPotential.toLocaleString()} kr.`,
      
      `Jag analyserar din portfölj och ser en tydlig strategi: ${artworks.length} verk med en sammanlagd vinstpotential på ${totalPotential.toLocaleString()} kr. Ditt genomsnittliga avkastning på ${avgProfit.toFixed(1)}% är betydligt över marknadssnittet. Konstverken visar en spännande bredd från ${artworks[0]?.artist || 'etablerade namn'} till ${artworks[artworks.length-1]?.artist || 'nya röster'}, vilket skapar en dynamisk och balanserad samling.`,
      
      `Ditt urval av ${artworks.length} konstverk visar en sofistikerad förståelse för marknaden. Med en total investering på ${totalValue.toLocaleString()} kr och en potentiell avkastning på ${totalPotential.toLocaleString()} kr, har du skapat en portfölj som kombinerar konstnärligt värde med ekonomisk potential. Den genomsnittliga vinstmarginalen på ${avgProfit.toFixed(1)}% vittnar om din förmåga att identifiera undervärderade verk.`
    ]
    
    return {
      message: analyses[Math.floor(Math.random() * analyses.length)],
      type: 'analysis',
      timestamp: new Date().toISOString()
    }
  }

  async getCurrentTrends(): Promise<BorisArtResponse> {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const trends = [
      `Just nu ser vi en stark trend mot abstrakt expressionism och minimalistisk landskapskonst. Köpare värderar verk som balanserar teknisk skicklighet med emotionell djup. Marknaden visar särskilt intresse för konstnärer som blandar traditionella tekniker med moderna teman. Priserna för samtida nordiska konstnärer har ökat med 15-20% det senaste året.`,
      
      `Den nuvarande konstmarknaden domineras av hållbarhetstänkande och ekologiskt medvetna verk. Samtida konstnärer som använder återvunna material eller tar upp miljöfrågor får enorm uppmärksamhet. Investorer ser också en ökad efterfrågan på mindre format som fungerar bra i hemmiljö. Digital konst och NFT-marknaden har stabiliserats efter den initiala hype-nivån.`,
      
      `Trenderna just nu pekar mot en återgång till det hantverksmässiga. Konstverk som visar tydlig teknisk skicklighet och materialkunskap är extra eftertraktade. Vi ser också en ökad intresse för konst från 1960-80-talet, särskilt skandinavisk modernism. Färgpaletterna domineras av jordnära toner med accentfärger i djupblått och terrakotta.`
    ]
    
    return {
      message: trends[Math.floor(Math.random() * trends.length)],
      type: 'trend',
      timestamp: new Date().toISOString()
    }
  }

  async getArtOpinion(topic: string): Promise<BorisArtResponse> {
    await new Promise(resolve => setTimeout(resolve, 1200))
    
    const opinions: Record<string, string[]> = {
      'oljemålning': [
        `Oljemålning förblir den mest älskade tekniken för seriösa samlare. Med sin rika historia och tidlösa kvalitet, erbjuder olja en djup och lysterisk skönhet som ingen annan teknik kan matcha. Den nuvarande marknaden visar särskilt starkt intresse för samtida oljemålningar som bygger på klassiska traditioner.`,
        
        `Oljemåleriets tidlösa appell ligger i dess förmåga att fånga ljus och skugga på ett sätt som känns både naturtroget och magiskt. Teknikens mångfacetterade uttrycksmöjligheter gör att varje verk blir unikt. Investeringar i högkvalitativa oljemålningar har historiskt visat sig vara bland de mest stabila på konstmarknaden.`
      ],
      
      'skulptur': [
        `Skulptur upplever just nu en renässans. Tre-dimensionella verk skapar en närvaro i rummet som två-dimensionell konst inte kan matcha. Marknaden för samtida skulptur, särskilt i material som brons och sten, har visat en imponerande tillväxt med 25% det senaste året.`,
        
        `Skulpturens fysiska närvaro gör den till en särskilt engagerande konstform. Från små desktop-objekt till monumentala verk, skulptur kräver betraktaren att röra sig runt verket och uppleva det från olika vinklar. Denna interaktiva kvalitet gör skulptur till en spännande investering.`
      ],
      
      'investering': [
        `Konstinvestering handlar om mer än bara pengar - det är en investering i kultur, skönhet och mänskligt uttryck. Den bästa strategin är att köpa verk du älskar, från konstnärer du tror på. Historiskt har konstmarknaden visat en genomsnittlig årlig avkastning på 5-8%, men för den kunnige samlaren kan avkastningen vara betydligt högre.`,
        
        `Att investera i konst kräver både kunskap och intuition. Jag rekommenderar att diversifiera sin portfölj mellan etablerade konstnärer och lovande nya talanger. Titta på konstnärens utställningshistorik, representation i samlingar och kritikers respons. Kom ihåg att det bästa konstverket är det som talar till dig personligt.`
      ]
    }
    
    const topicKey = topic.toLowerCase()
    const topicOpinions = opinions[topicKey] || [
      `Det är en fascinerande aspekt av konstvärlden som väcker många frågor och diskussioner. Min erfarenhet säger att det viktigaste är att hålla sig till sin egen känsla och kunskap. Konstmarknaden är komplex, men den som lär sig att lyssna på både hjärta och intellekt brukar göra bra val.`,
      
      `Detta är ett ämne som engagerar många i konstvärlden just nu. Jag ser en trend mot mer genomtänkta och medvetna val, både hos konstnärer och samlare. Det handlar om att hitta balansen mellan kommersiellt värde och konstnärlig integritet.`
    ]
    
    return {
      message: topicOpinions[Math.floor(Math.random() * topicOpinions.length)],
      type: 'opinion',
      timestamp: new Date().toISOString()
    }
  }

  async chatWithBoris(message: string): Promise<BorisArtResponse> {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('berättelse') || lowerMessage.includes('story')) {
      return {
        message: 'Berättelser i konsten är vad ger den själ. Varje verk bär med sig en historia - om konstnären, om tiden det skapades, om de känslor den vill förmedla. När du står framför ett konstverk, fråga dig själv: Vilken historia vill detta verk berätta mig? Svaret är ofta personligt och unikt för varje betraktare.',
        type: 'opinion',
        timestamp: new Date().toISOString()
      }
    }
    
    if (lowerMessage.includes('trend') || lowerMessage.includes('modernt')) {
      return this.getCurrentTrends()
    }
    
    if (lowerMessage.includes('investera') || lowerMessage.includes('köpa')) {
      return this.getArtOpinion('investering')
    }
    
    if (lowerMessage.includes('olja')) {
      return this.getArtOpinion('oljemålning')
    }
    
    if (lowerMessage.includes('skulptur')) {
      return this.getArtOpinion('skulptur')
    }
    
    // Default responses
    const defaultResponses = [
      `Det är en intressant reflektion om konst. Som BorisArt AI strävar jag efter att ge insikter som balanserar konstnärlig passion med marknadskunskap. Konstvärlden är i ständig utveckling, och det som är trendigt idag kan vara klassiskt imorgon.`,
      
      `Din fråga berör kärnan i vad det innebär att engagera sig i konst. Det handlar om att utveckla sitt öga, sitt sinne och sin intuition. Ju mer du tittar, läser och reflekterar, desto djupare blir din förståelse för konstens många dimensioner.`,
      
      `Konst är en evig konversation mellan dåtid, nutid och framtid. Varje verk är både en produkt av sin tid och en kommentar till den. Att förstå konst handlar om att lyssna till denna konversation och hitta sin egen röst i den.`
    ]
    
    return {
      message: defaultResponses[Math.floor(Math.random() * defaultResponses.length)],
      type: 'opinion',
      timestamp: new Date().toISOString()
    }
  }
}
