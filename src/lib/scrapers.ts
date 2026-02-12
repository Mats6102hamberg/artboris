import axios from 'axios'
import * as cheerio from 'cheerio'

export interface ScrapedItem {
  title: string
  artist: string
  price: number
  imageUrl: string
  url: string
  source: string
  description: string
  category: string
}

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'sv-SE,sv;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
}

function extractPrice(text: string): number {
  // Remove spaces used as thousand separators (common in Swedish)
  const cleaned = text.replace(/\s/g, '').replace(/\u00a0/g, '')
  const match = cleaned.match(/[\d]+/)
  if (!match) return 0
  const price = parseInt(match[0], 10)
  if (isNaN(price) || price < 100) return 0
  return price
}

// ─── Bukowskis ──────────────────────────────────────────────────

async function scrapeBukowskis(type: string): Promise<ScrapedItem[]> {
  const category = type === 'sculptures' ? 'skulptur' : 'maleri'
  const url = `https://www.bukowskis.com/sv/lots?category=${category}`

  try {
    console.log(`[Bukowskis] Fetching ${url}`)
    const { data: html } = await axios.get(url, { headers: HEADERS, timeout: 15000 })
    const $ = cheerio.load(html)
    const items: ScrapedItem[] = []

    // Bukowskis uses Next.js with SSR. Try multiple selector strategies.
    const selectorStrategies = [
      // Strategy 1: lot cards
      { container: '[class*="lot"], [class*="Lot"]', title: '[class*="title"], [class*="Title"], h3, h4', artist: '[class*="artist"], [class*="Artist"], [class*="maker"]', price: '[class*="price"], [class*="Price"], [class*="estimate"], [class*="Estimate"]' },
      // Strategy 2: generic card/item
      { container: '[class*="card"], [class*="Card"], [class*="item"], [class*="Item"]', title: 'h3, h4, [class*="name"], [class*="title"]', artist: '[class*="artist"], [class*="by"], [class*="creator"]', price: '[class*="price"], [class*="amount"], [class*="bid"]' },
      // Strategy 3: list items with links
      { container: 'a[href*="/lots/"]', title: 'h3, h4, span, div', artist: '[class*="artist"], span', price: '[class*="price"], [class*="kr"]' },
    ]

    for (const strategy of selectorStrategies) {
      $(strategy.container).each((_, el) => {
        const $el = $(el)
        const title = $el.find(strategy.title).first().text().trim()
        const artist = $el.find(strategy.artist).first().text().trim()
        const priceText = $el.find(strategy.price).first().text().trim()
        const img = $el.find('img').first()
        const imageUrl = img.attr('src') || img.attr('data-src') || ''
        const link = $el.is('a') ? $el.attr('href') : $el.find('a').first().attr('href')
        const itemUrl = link ? (link.startsWith('http') ? link : `https://www.bukowskis.com${link}`) : ''

        const price = extractPrice(priceText)
        if (title && price > 0) {
          items.push({
            title,
            artist: artist || 'Okänd konstnär',
            price,
            imageUrl,
            url: itemUrl,
            source: 'Bukowskis',
            description: priceText,
            category: type,
          })
        }
      })
      if (items.length > 0) break
    }

    // If still no items, try to extract from Next.js __NEXT_DATA__
    if (items.length === 0) {
      const nextDataScript = $('#__NEXT_DATA__').html()
      if (nextDataScript) {
        try {
          const nextData = JSON.parse(nextDataScript)
          const props = nextData?.props?.pageProps
          const lots = props?.lots || props?.items || props?.results || props?.data?.lots || []
          for (const lot of Array.isArray(lots) ? lots : []) {
            const title = lot.title || lot.name || ''
            const artist = lot.artist || lot.maker || lot.creator || ''
            const price = lot.price || lot.currentBid || lot.estimateLow || lot.hammer_price || 0
            const imageUrl = lot.imageUrl || lot.image || lot.thumbnail || ''
            const lotUrl = lot.url || lot.href || (lot.id ? `https://www.bukowskis.com/sv/lots/${lot.id}` : '')

            if (title && price > 0) {
              items.push({
                title,
                artist: artist || 'Okänd konstnär',
                price: typeof price === 'number' ? price : extractPrice(String(price)),
                imageUrl,
                url: lotUrl,
                source: 'Bukowskis',
                description: lot.description || '',
                category: type,
              })
            }
          }
        } catch (e) {
          console.log('[Bukowskis] Could not parse __NEXT_DATA__')
        }
      }
    }

    console.log(`[Bukowskis] Found ${items.length} items`)
    return items
  } catch (error: any) {
    console.error(`[Bukowskis] Error: ${error.message}`)
    return []
  }
}

// ─── Barnebys ───────────────────────────────────────────────────

async function scrapeBarnebys(type: string): Promise<ScrapedItem[]> {
  const category = type === 'sculptures' ? 'skulpturer' : 'maleri'
  const url = `https://www.barnebys.se/auktioner/${category}`

  try {
    console.log(`[Barnebys] Fetching ${url}`)
    const { data: html } = await axios.get(url, { headers: HEADERS, timeout: 15000 })
    const $ = cheerio.load(html)
    const items: ScrapedItem[] = []

    const selectorStrategies = [
      { container: '[class*="lot"], [class*="Lot"], [class*="auction-item"]', title: '[class*="title"], [class*="Title"], h3, h4', artist: '[class*="artist"], [class*="Artist"], [class*="house"]', price: '[class*="price"], [class*="Price"], [class*="estimate"]' },
      { container: '[class*="card"], [class*="Card"], [class*="result"]', title: 'h3, h4, [class*="name"], [class*="title"]', artist: '[class*="artist"], span[class*="sub"]', price: '[class*="price"], [class*="amount"]' },
      { container: 'a[href*="/lot/"], a[href*="/auction"]', title: 'h3, h4, span, div[class*="title"]', artist: 'span, div[class*="sub"]', price: '[class*="price"], span[class*="kr"]' },
    ]

    for (const strategy of selectorStrategies) {
      $(strategy.container).each((_, el) => {
        const $el = $(el)
        const title = $el.find(strategy.title).first().text().trim()
        const artist = $el.find(strategy.artist).first().text().trim()
        const priceText = $el.find(strategy.price).first().text().trim()
        const img = $el.find('img').first()
        const imageUrl = img.attr('src') || img.attr('data-src') || ''
        const link = $el.is('a') ? $el.attr('href') : $el.find('a').first().attr('href')
        const itemUrl = link ? (link.startsWith('http') ? link : `https://www.barnebys.se${link}`) : ''

        const price = extractPrice(priceText)
        if (title && price > 0) {
          items.push({
            title,
            artist: artist || 'Okänd konstnär',
            price,
            imageUrl,
            url: itemUrl,
            source: 'Barnebys',
            description: priceText,
            category: type,
          })
        }
      })
      if (items.length > 0) break
    }

    // Try JSON-LD structured data
    if (items.length === 0) {
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const ld = JSON.parse($(el).html() || '')
          const offers = ld?.offers || ld?.itemListElement || []
          for (const offer of Array.isArray(offers) ? offers : [offers]) {
            const item = offer?.item || offer
            const title = item?.name || ''
            const price = parseFloat(item?.price || item?.lowPrice || '0')
            if (title && price > 0) {
              items.push({
                title,
                artist: item?.brand?.name || item?.creator?.name || 'Okänd konstnär',
                price,
                imageUrl: item?.image || '',
                url: item?.url || '',
                source: 'Barnebys',
                description: item?.description || '',
                category: type,
              })
            }
          }
        } catch {}
      })
    }

    console.log(`[Barnebys] Found ${items.length} items`)
    return items
  } catch (error: any) {
    console.error(`[Barnebys] Error: ${error.message}`)
    return []
  }
}

// ─── Auctionet ──────────────────────────────────────────────────

async function scrapeAuctionet(type: string): Promise<ScrapedItem[]> {
  // Auctionet has a public JSON API
  const categoryId = type === 'sculptures' ? 5 : 1 // 1=paintings, 5=sculptures
  const apiUrl = `https://auctionet.com/api/v3/items?category_id=${categoryId}&order=recent&limit=40`
  const fallbackUrl = `https://auctionet.com/sv/search?q=${type === 'sculptures' ? 'skulptur' : 'tavla'}`

  try {
    // Try API first
    console.log(`[Auctionet] Trying API: ${apiUrl}`)
    try {
      const { data } = await axios.get(apiUrl, { headers: HEADERS, timeout: 15000 })
      const apiItems = data?.items || data?.data || data || []

      if (Array.isArray(apiItems) && apiItems.length > 0) {
        const items: ScrapedItem[] = []
        for (const item of apiItems) {
          const price = item.current_bid || item.starting_bid || item.estimate_low || 0
          if (price > 0) {
            items.push({
              title: item.title || item.name || '',
              artist: item.artist || item.maker || 'Okänd konstnär',
              price,
              imageUrl: item.image_url || item.thumbnail_url || '',
              url: item.url || `https://auctionet.com/sv/items/${item.id}`,
              source: 'Auctionet',
              description: item.description || '',
              category: type,
            })
          }
        }
        console.log(`[Auctionet] API returned ${items.length} items`)
        return items
      }
    } catch (apiErr: any) {
      console.log(`[Auctionet] API failed: ${apiErr.message}, falling back to HTML`)
    }

    // Fallback: scrape HTML
    console.log(`[Auctionet] Fetching HTML: ${fallbackUrl}`)
    const { data: html } = await axios.get(fallbackUrl, { headers: HEADERS, timeout: 15000 })
    const $ = cheerio.load(html)
    const items: ScrapedItem[] = []

    const selectorStrategies = [
      { container: '[class*="item"], [class*="Item"], [class*="lot"]', title: '[class*="title"], h3, h4, a', artist: '[class*="artist"], [class*="maker"]', price: '[class*="price"], [class*="bid"], [class*="estimate"]' },
      { container: '.search-result, .result, .card', title: 'h3, h4, .title, a', artist: '.artist, .sub-title', price: '.price, .bid' },
      { container: 'a[href*="/items/"]', title: 'h3, h4, span, div', artist: 'span[class*="artist"]', price: '[class*="price"]' },
    ]

    for (const strategy of selectorStrategies) {
      $(strategy.container).each((_, el) => {
        const $el = $(el)
        const title = $el.find(strategy.title).first().text().trim()
        const artist = $el.find(strategy.artist).first().text().trim()
        const priceText = $el.find(strategy.price).first().text().trim()
        const img = $el.find('img').first()
        const imageUrl = img.attr('src') || img.attr('data-src') || ''
        const link = $el.is('a') ? $el.attr('href') : $el.find('a').first().attr('href')
        const itemUrl = link ? (link.startsWith('http') ? link : `https://auctionet.com${link}`) : ''

        const price = extractPrice(priceText)
        if (title && price > 0) {
          items.push({
            title,
            artist: artist || 'Okänd konstnär',
            price,
            imageUrl,
            url: itemUrl,
            source: 'Auctionet',
            description: priceText,
            category: type,
          })
        }
      })
      if (items.length > 0) break
    }

    console.log(`[Auctionet] Found ${items.length} items`)
    return items
  } catch (error: any) {
    console.error(`[Auctionet] Error: ${error.message}`)
    return []
  }
}

// ─── Tradera ────────────────────────────────────────────────────

async function scrapeTradera(type: string): Promise<ScrapedItem[]> {
  const query = type === 'sculptures' ? 'skulptur+konst' : 'oljemålning+tavla'
  const url = `https://www.tradera.com/search?q=${query}&categoryId=302020`

  try {
    console.log(`[Tradera] Fetching ${url}`)
    const { data: html } = await axios.get(url, { headers: HEADERS, timeout: 15000 })
    const $ = cheerio.load(html)
    const items: ScrapedItem[] = []

    const selectorStrategies = [
      { container: '[class*="item"], [class*="Item"], [class*="product"]', title: '[class*="title"], [class*="Title"], h3, h4', artist: '[class*="seller"], [class*="brand"]', price: '[class*="price"], [class*="Price"], [class*="bid"]' },
      { container: '.card, .listing, [data-testid]', title: 'h3, h4, .title, a', artist: '.seller, .sub', price: '.price, .amount' },
      { container: 'a[href*="/item/"]', title: 'h3, h4, span, div', artist: 'span', price: '[class*="price"]' },
    ]

    for (const strategy of selectorStrategies) {
      $(strategy.container).each((_, el) => {
        const $el = $(el)
        const title = $el.find(strategy.title).first().text().trim()
        const priceText = $el.find(strategy.price).first().text().trim()
        const img = $el.find('img').first()
        const imageUrl = img.attr('src') || img.attr('data-src') || ''
        const link = $el.is('a') ? $el.attr('href') : $el.find('a').first().attr('href')
        const itemUrl = link ? (link.startsWith('http') ? link : `https://www.tradera.com${link}`) : ''

        const price = extractPrice(priceText)
        if (title && price > 0) {
          items.push({
            title,
            artist: 'Okänd konstnär',
            price,
            imageUrl,
            url: itemUrl,
            source: 'Tradera',
            description: priceText,
            category: type,
          })
        }
      })
      if (items.length > 0) break
    }

    // Try __NEXT_DATA__ (Tradera uses Next.js)
    if (items.length === 0) {
      const nextDataScript = $('#__NEXT_DATA__').html()
      if (nextDataScript) {
        try {
          const nextData = JSON.parse(nextDataScript)
          const searchResults = nextData?.props?.pageProps?.searchResult?.items ||
                               nextData?.props?.pageProps?.items ||
                               nextData?.props?.pageProps?.data?.items || []
          for (const item of Array.isArray(searchResults) ? searchResults : []) {
            const price = item.price || item.currentBid || item.buyNowPrice || 0
            if (price > 0) {
              items.push({
                title: item.title || item.shortDescription || '',
                artist: 'Okänd konstnär',
                price,
                imageUrl: item.imageUrl || item.thumbnailUrl || item.image || '',
                url: item.itemUrl || `https://www.tradera.com/item/${item.id}`,
                source: 'Tradera',
                description: item.description || '',
                category: type,
              })
            }
          }
        } catch (e) {
          console.log('[Tradera] Could not parse __NEXT_DATA__')
        }
      }
    }

    console.log(`[Tradera] Found ${items.length} items`)
    return items
  } catch (error: any) {
    console.error(`[Tradera] Error: ${error.message}`)
    return []
  }
}

// ─── Public API ─────────────────────────────────────────────────

const SCRAPERS: Record<string, (type: string) => Promise<ScrapedItem[]>> = {
  bukowskis: scrapeBukowskis,
  barnebys: scrapeBarnebys,
  auctionet: scrapeAuctionet,
  tradera: scrapeTradera,
}

export const AVAILABLE_SOURCES = Object.keys(SCRAPERS)

export async function scrapeAll(
  sources: string[],
  type: string
): Promise<{ items: ScrapedItem[]; sourceResults: Record<string, number> }> {
  const validSources = sources.filter(s => SCRAPERS[s])
  console.log(`[Scraper] Starting scrape for type="${type}", sources=${validSources.join(', ')}`)

  const results = await Promise.allSettled(
    validSources.map(source => SCRAPERS[source](type))
  )

  const items: ScrapedItem[] = []
  const sourceResults: Record<string, number> = {}

  results.forEach((result, i) => {
    const source = validSources[i]
    if (result.status === 'fulfilled') {
      sourceResults[source] = result.value.length
      items.push(...result.value)
    } else {
      sourceResults[source] = 0
      console.error(`[Scraper] ${source} failed:`, result.reason)
    }
  })

  console.log(`[Scraper] Total: ${items.length} items from ${validSources.length} sources`)
  return { items, sourceResults }
}
