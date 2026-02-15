import axios from 'axios'
import * as cheerio from 'cheerio'
import { fetchWithBrowser } from './browserHelper'

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
    let html: string
    let usedBrowser = false

    // Try axios first (fast)
    try {
      const resp = await axios.get(url, { headers: HEADERS, timeout: 15000 })
      html = resp.data
    } catch {
      html = ''
    }

    let items = parseBarnebysHtml(html, type)

    // Puppeteer fallback if cheerio found nothing
    if (items.length === 0) {
      console.log('[Barnebys] axios returned 0 items, trying Puppeteer…')
      try {
        html = await fetchWithBrowser(url, '[class*="lot"], [class*="card"], [class*="item"]')
        usedBrowser = true
        items = parseBarnebysHtml(html, type)
      } catch (e: any) {
        console.log(`[Barnebys] Puppeteer failed: ${e.message}`)
      }
    }

    console.log(`[Barnebys] Found ${items.length} items${usedBrowser ? ' (via Puppeteer)' : ''}`)
    return items
  } catch (error: any) {
    console.error(`[Barnebys] Error: ${error.message}`)
    return []
  }
}

function parseBarnebysHtml(html: string, type: string): ScrapedItem[] {
  if (!html) return []
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

  return items
}

// ─── Auctionet (shared parser — also used by Stockholms Aukt.) ──

async function scrapeAuctionetPage(
  url: string,
  source: string,
  type: string
): Promise<ScrapedItem[]> {
  try {
    console.log(`[${source}] Fetching ${url} with Puppeteer`)
    const html = await fetchWithBrowser(url, '.c-lot-card, .lot-card, [class*="item"], [class*="card"]')
    return parseAuctionetHtml(html, source, type)
  } catch (error: any) {
    console.error(`[${source}] Puppeteer error: ${error.message}`)
    return []
  }
}

function parseAuctionetHtml(html: string, source: string, type: string): ScrapedItem[] {
  if (!html) return []
  const $ = cheerio.load(html)
  const items: ScrapedItem[] = []

  const selectorStrategies = [
    // Auctionet lot cards
    { container: '.c-lot-card, .lot-card, [class*="LotCard"]', title: '.c-lot-card__title, .lot-card__title, [class*="title"], h3, h4', artist: '.c-lot-card__subtitle, [class*="artist"], [class*="maker"]', price: '.c-lot-card__price, [class*="price"], [class*="bid"]' },
    { container: '[class*="item"], [class*="Item"], [class*="lot"]', title: '[class*="title"], h3, h4, a', artist: '[class*="artist"], [class*="maker"]', price: '[class*="price"], [class*="bid"], [class*="estimate"]' },
    { container: '.search-result, .result, .card', title: 'h3, h4, .title, a', artist: '.artist, .sub-title', price: '.price, .bid' },
    { container: 'a[href*="/items/"], a[href*="/objekt/"]', title: 'h3, h4, span, div', artist: 'span[class*="artist"]', price: '[class*="price"]' },
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
          source,
          description: priceText,
          category: type,
        })
      }
    })
    if (items.length > 0) break
  }

  return items
}

// ─── Auctionet ──────────────────────────────────────────────────

async function scrapeAuctionet(type: string): Promise<ScrapedItem[]> {
  const query = type === 'sculptures' ? 'skulptur' : 'tavla'
  const url = `https://auctionet.com/sv/search?q=${query}`

  try {
    console.log(`[Auctionet] Scraping ${url}`)
    const items = await scrapeAuctionetPage(url, 'Auctionet', type)
    console.log(`[Auctionet] Found ${items.length} items`)
    return items
  } catch (error: any) {
    console.error(`[Auctionet] Error: ${error.message}`)
    return []
  }
}

// ─── Stockholms Auktionsverk (via Auctionet company_id) ─────────

async function scrapeStockholmsAuktionsverk(type: string): Promise<ScrapedItem[]> {
  const query = type === 'sculptures' ? 'skulptur' : 'tavla'
  const url = `https://auctionet.com/sv/search?company_id=242&q=${query}`

  try {
    console.log(`[Stockholms Auktionsverk] Scraping via Auctionet: ${url}`)
    const items = await scrapeAuctionetPage(url, 'Stockholms Auktionsverk', type)
    console.log(`[Stockholms Auktionsverk] Found ${items.length} items`)
    return items
  } catch (error: any) {
    console.error(`[Stockholms Auktionsverk] Error: ${error.message}`)
    return []
  }
}

// ─── Tradera ────────────────────────────────────────────────────

async function scrapeTradera(type: string): Promise<ScrapedItem[]> {
  const query = type === 'sculptures' ? 'skulptur+konst' : 'oljemålning+tavla'
  const url = `https://www.tradera.com/search?q=${query}&categoryId=302020`

  try {
    console.log(`[Tradera] Fetching ${url}`)
    let html: string
    let usedBrowser = false

    // Try axios first
    try {
      const resp = await axios.get(url, { headers: HEADERS, timeout: 15000 })
      html = resp.data
    } catch {
      html = ''
    }

    let items = parseTraderaHtml(html, type)

    // Puppeteer fallback
    if (items.length === 0) {
      console.log('[Tradera] axios returned 0 items, trying Puppeteer…')
      try {
        html = await fetchWithBrowser(url, '[class*="item"], [class*="card"], [data-testid]')
        usedBrowser = true
        items = parseTraderaHtml(html, type)
      } catch (e: any) {
        console.log(`[Tradera] Puppeteer failed: ${e.message}`)
      }
    }

    console.log(`[Tradera] Found ${items.length} items${usedBrowser ? ' (via Puppeteer)' : ''}`)
    return items
  } catch (error: any) {
    console.error(`[Tradera] Error: ${error.message}`)
    return []
  }
}

function parseTraderaHtml(html: string, type: string): ScrapedItem[] {
  if (!html) return []
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

  return items
}

// ─── Lauritz ───────────────────────────────────────────────────

async function scrapeLauritz(type: string): Promise<ScrapedItem[]> {
  const query = type === 'sculptures' ? 'skulptur' : 'maleri'
  const url = `https://www.lauritz.com/sv/sok?q=${query}`

  try {
    console.log(`[Lauritz] Fetching ${url}`)
    let html: string
    let usedBrowser = false

    // Try axios + __NEXT_DATA__ first
    try {
      const resp = await axios.get(url, { headers: HEADERS, timeout: 15000 })
      html = resp.data
    } catch {
      html = ''
    }

    let items = parseLauritzHtml(html, type)

    // Puppeteer fallback
    if (items.length === 0) {
      console.log('[Lauritz] axios returned 0 items, trying Puppeteer…')
      try {
        html = await fetchWithBrowser(url, '[class*="lot"], [class*="card"], [class*="item"]')
        usedBrowser = true
        items = parseLauritzHtml(html, type)
      } catch (e: any) {
        console.log(`[Lauritz] Puppeteer failed: ${e.message}`)
      }
    }

    console.log(`[Lauritz] Found ${items.length} items${usedBrowser ? ' (via Puppeteer)' : ''}`)
    return items
  } catch (error: any) {
    console.error(`[Lauritz] Error: ${error.message}`)
    return []
  }
}

function parseLauritzHtml(html: string, type: string): ScrapedItem[] {
  if (!html) return []
  const $ = cheerio.load(html)
  const items: ScrapedItem[] = []

  // Try __NEXT_DATA__ first (Lauritz runs Next.js)
  const nextDataScript = $('#__NEXT_DATA__').html()
  if (nextDataScript) {
    try {
      const nextData = JSON.parse(nextDataScript)
      const props = nextData?.props?.pageProps
      const lots = props?.lots || props?.items || props?.searchResult?.items ||
                   props?.results || props?.data?.items || []
      for (const lot of Array.isArray(lots) ? lots : []) {
        const title = lot.title || lot.name || lot.headline || ''
        const artist = lot.artist || lot.maker || lot.creator || ''
        const price = lot.price || lot.currentBid || lot.estimateLow || lot.hammerPrice || 0
        const imageUrl = lot.imageUrl || lot.image || lot.thumbnail || lot.photo || ''
        const lotUrl = lot.url || lot.href || (lot.id ? `https://www.lauritz.com/sv/auktion/${lot.id}` : '')

        if (title && (typeof price === 'number' ? price : extractPrice(String(price))) > 0) {
          items.push({
            title,
            artist: artist || 'Okänd konstnär',
            price: typeof price === 'number' ? price : extractPrice(String(price)),
            imageUrl,
            url: lotUrl,
            source: 'Lauritz',
            description: lot.description || '',
            category: type,
          })
        }
      }
    } catch (e) {
      console.log('[Lauritz] Could not parse __NEXT_DATA__')
    }
  }

  if (items.length > 0) return items

  // Cheerio selectors fallback
  const selectorStrategies = [
    { container: '[class*="lot"], [class*="Lot"], [class*="item-card"]', title: '[class*="title"], [class*="Title"], h3, h4', artist: '[class*="artist"], [class*="Artist"], [class*="maker"]', price: '[class*="price"], [class*="Price"], [class*="estimate"]' },
    { container: '[class*="card"], [class*="Card"], [class*="product"]', title: 'h3, h4, [class*="name"], [class*="title"]', artist: '[class*="artist"], [class*="sub"]', price: '[class*="price"], [class*="amount"]' },
    { container: 'a[href*="/lot/"], a[href*="/auction/"], a[href*="/auktion/"]', title: 'h3, h4, span, div', artist: 'span[class*="artist"]', price: '[class*="price"], [class*="kr"]' },
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
      const itemUrl = link ? (link.startsWith('http') ? link : `https://www.lauritz.com${link}`) : ''

      const price = extractPrice(priceText)
      if (title && price > 0) {
        items.push({
          title,
          artist: artist || 'Okänd konstnär',
          price,
          imageUrl,
          url: itemUrl,
          source: 'Lauritz',
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
              source: 'Lauritz',
              description: item?.description || '',
              category: type,
            })
          }
        }
      } catch {}
    })
  }

  return items
}

// ─── Catawiki ──────────────────────────────────────────────────

async function scrapeCatawiki(type: string): Promise<ScrapedItem[]> {
  const category = type === 'sculptures' ? 'sculptures' : 'paintings'
  const url = `https://www.catawiki.com/en/c/485-${category}`

  try {
    console.log(`[Catawiki] Fetching ${url} with Puppeteer (Cloudflare)`)

    // Catawiki has Cloudflare protection — stealth Puppeteer required
    const html = await fetchWithBrowser(url, '[class*="lot"], [class*="card"], [class*="item"]')
    const items = parseCatawikiHtml(html, type)

    console.log(`[Catawiki] Found ${items.length} items`)
    return items
  } catch (error: any) {
    console.error(`[Catawiki] Error: ${error.message}`)
    return []
  }
}

function parseCatawikiHtml(html: string, type: string): ScrapedItem[] {
  if (!html) return []
  const $ = cheerio.load(html)
  const items: ScrapedItem[] = []

  const selectorStrategies = [
    { container: '[class*="lot"], [class*="Lot"], [class*="auction-card"]', title: '[class*="title"], [class*="Title"], h3, h4', artist: '[class*="artist"], [class*="Artist"], [class*="subtitle"]', price: '[class*="price"], [class*="Price"], [class*="bid"], [class*="Bid"]' },
    { container: '[class*="card"], [class*="Card"], [class*="item"]', title: 'h3, h4, [class*="name"], [class*="title"]', artist: '[class*="artist"], [class*="sub"]', price: '[class*="price"], [class*="amount"]' },
    { container: 'a[href*="/lots/"], a[href*="/l/"]', title: 'h3, h4, span, div[class*="title"]', artist: 'span[class*="sub"], span[class*="artist"]', price: '[class*="price"], [class*="bid"]' },
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
      const itemUrl = link ? (link.startsWith('http') ? link : `https://www.catawiki.com${link}`) : ''

      const price = extractPrice(priceText)
      // Catawiki prices are in EUR — convert roughly to SEK
      const priceSek = price > 0 ? Math.round(price * 11.5) : 0
      if (title && priceSek > 0) {
        items.push({
          title,
          artist: artist || 'Okänd konstnär',
          price: priceSek,
          imageUrl,
          url: itemUrl,
          source: 'Catawiki',
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
          const priceVal = parseFloat(item?.price || item?.lowPrice || '0')
          // Catawiki uses EUR — convert roughly to SEK
          const price = priceVal > 0 ? Math.round(priceVal * 11.5) : 0
          if (title && price > 0) {
            items.push({
              title,
              artist: item?.brand?.name || item?.creator?.name || 'Okänd konstnär',
              price,
              imageUrl: item?.image || '',
              url: item?.url || '',
              source: 'Catawiki',
              description: item?.description || '',
              category: type,
            })
          }
        }
      } catch {}
    })
  }

  return items
}

// ─── Public API ─────────────────────────────────────────────────

const SCRAPERS: Record<string, (type: string) => Promise<ScrapedItem[]>> = {
  bukowskis: scrapeBukowskis,
  barnebys: scrapeBarnebys,
  auctionet: scrapeAuctionet,
  tradera: scrapeTradera,
  lauritz: scrapeLauritz,
  stockholms: scrapeStockholmsAuktionsverk,
  catawiki: scrapeCatawiki,
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
