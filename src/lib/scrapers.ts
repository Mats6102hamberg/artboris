import axios from 'axios'
import * as cheerio from 'cheerio'

export interface ArtItem {
  title: string
  artist: string
  price: number
  estimatedValue: number
  profitMargin: number
  source: string
  imageUrl: string
  description: string
  url?: string
}

export class ArtScraper {
  private static async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  static async scrapeBukowskis(type: string): Promise<ArtItem[]> {
    try {
      // IRL implementation:
      // const response = await axios.get('https://www.bukowskis.com/sv/auctions/upcoming')
      // const $ = cheerio.load(response.data)
      // ... parsing logic
      
      // Mock data för demo
      await this.delay(1000)
      
      if (type === 'paintings') {
        return [
          {
            title: "Sommarlandskap",
            artist: "Carl Larsson (efter)",
            price: 35000,
            estimatedValue: 65000,
            profitMargin: 86,
            source: "Bukowskis",
            imageUrl: "https://picsum.photos/seed/bukowskis1/400/300",
            description: "Oljemålning på duk, 70x90cm",
            url: "https://www.bukowskis.com/sv/item/123"
          },
          {
            title: "Porträtt av dam",
            artist: "Anders Zorn (stil)",
            price: 45000,
            estimatedValue: 85000,
            profitMargin: 89,
            source: "Bukowskis",
            imageUrl: "https://picsum.photos/seed/bukowskis2/400/300",
            description: "Oljemålning på duk, 60x80cm",
            url: "https://www.bukowskis.com/sv/item/456"
          }
        ]
      }
      
      return []
    } catch (error) {
      console.error('Bukowskis scraping error:', error)
      return []
    }
  }

  static async scrapeLauritz(type: string): Promise<ArtItem[]> {
    try {
      // IRL: https://www.lauritz.com/sv/
      await this.delay(1200)
      
      if (type === 'paintings') {
        return [
          {
            title: "Marinmålning",
            artist: "Viking Svensson",
            price: 22000,
            estimatedValue: 42000,
            profitMargin: 91,
            source: "Lauritz",
            imageUrl: "https://picsum.photos/seed/lauritz1/400/300",
            description: "Oljemålning på duk, 55x75cm",
            url: "https://www.lauritz.com/sv/item/789"
          }
        ]
      }
      
      return []
    } catch (error) {
      console.error('Lauritz scraping error:', error)
      return []
    }
  }

  static async scrapeBarnebys(type: string): Promise<ArtItem[]> {
    try {
      // IRL: https://www.barnebys.com/
      await this.delay(800)
      
      if (type === 'paintings') {
        return [
          {
            title: "Modernistisk abstraktion",
            artist: "Erik Lundberg",
            price: 38000,
            estimatedValue: 68000,
            profitMargin: 79,
            source: "Barnebys",
            imageUrl: "https://picsum.photos/seed/barnebys1/400/300",
            description: "Oljemålning på duk, 80x100cm",
            url: "https://www.barnebys.com/item/321"
          }
        ]
      }
      
      if (type === 'sculptures') {
        return [
          {
            title: "Stålbird",
            artist: "Nils Bergström",
            price: 55000,
            estimatedValue: 85000,
            profitMargin: 55,
            source: "Barnebys",
            imageUrl: "https://picsum.photos/seed/barnebys-sculpt1/400/300",
            description: "Stål, 40cm hög",
            url: "https://www.barnebys.com/item/654"
          }
        ]
      }
      
      return []
    } catch (error) {
      console.error('Barnebys scraping error:', error)
      return []
    }
  }

  static async scrapeKunstkompaniet(type: string): Promise<ArtItem[]> {
    try {
      // IRL: https://www.kunstkompaniet.no/
      await this.delay(1500)
      
      if (type === 'sculptures') {
        return [
          {
            title: "Guldfisk",
            artist: "Arne Nordheim",
            price: 68000,
            estimatedValue: 95000,
            profitMargin: 40,
            source: "Kunstkompaniet",
            imageUrl: "https://picsum.photos/seed/kunst1/400/300",
            description: "Bronserad metall, 25cm hög",
            url: "https://www.kunstkompaniet.no/item/987"
          }
        ]
      }
      
      return []
    } catch (error) {
      console.error('Kunstkompaniet scraping error:', error)
      return []
    }
  }

  static async scrapeUppsalaAuktionskammare(type: string): Promise<ArtItem[]> {
    try {
      // IRL: https://www.uppsalaauktion.se/
      await this.delay(1000)
      
      if (type === 'sculptures') {
        return [
          {
            title: "Granitfigur",
            artist: "Brita-Maja Renström",
            price: 95000,
            estimatedValue: 140000,
            profitMargin: 47,
            source: "Uppsala Auktionskammare",
            imageUrl: "https://picsum.photos/seed/uppsala1/400/300",
            description: "Granit, 60cm hög",
            url: "https://www.uppsalaauktion.se/item/246"
          }
        ]
      }
      
      return []
    } catch (error) {
      console.error('Uppsala Auktionskammare scraping error:', error)
      return []
    }
  }

  static async scrapeAll(type: string): Promise<ArtItem[]> {
    const scrapers = [
      () => this.scrapeBukowskis(type),
      () => this.scrapeLauritz(type),
      () => this.scrapeBarnebys(type),
      () => this.scrapeKunstkompaniet(type),
      () => this.scrapeUppsalaAuktionskammare(type)
    ]

    const results = await Promise.all(scrapers.map(scraper => scraper()))
    return results.flat()
  }
}
