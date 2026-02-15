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

    const selectorStrategies = [
      { container: '[class*="lot"], [class*="Lot"]', title: '[class*="title"], [class*="Title"], h3, h4', artist: '[class*="artist"], [class*="Artist"], [class*="maker"]', price: '[class*="price"], [class*="Price"], [class*="estimate"], [class*="Estimate"]' },
      { container: '[class*="card"], [class*="Card"], [class*="item"], [class*="Item"]', title: 'h3, h4, [class*="name"], [class*="title"]', artist: '[class*="artist"], [class*="by"], [class*="creator"]', price: '[class*="price"], [class*="amount"], [class*="bid"]' },
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
          items.push({ title, artist: artist || 'Okänd konstnär', price, imageUrl, url: itemUrl, source: 'Bukowskis', description: priceText, category: type })
        }
      })
      if (items.length > 0) break
    }

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
              items.push({ title, artist: artist || 'Okänd konstnär', price: typeof price === 'number' ? price : extractPrice(String(price)), imageUrl, url: lotUrl, source: 'Bukowskis', description: lot.description || '', category: type })
            }
          }
        } catch {
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

// ─── Auctionet (data-react-props JSON) ──────────────────────────

function parseAuctionetReactProps(html: string, source: string, type: string): ScrapedItem[] {
  if (!html) return []
  const $ = cheerio.load(html)
  const items: ScrapedItem[] = []

  // Auctionet embeds item data as JSON in data-react-props attributes
  $('[data-react-props]').each((_, el) => {
    try {
      const propsJson = $(el).attr('data-react-props')
      if (!propsJson || propsJson.length < 500) return // skip small non-item props
      const props = JSON.parse(propsJson)

      // The items can be at different paths depending on the component
      const itemArrays = [
        props?.items,
        props?.lots,
        props?.searchResult?.items,
        props?.data?.items,
      ]

      for (const arr of itemArrays) {
        if (!Array.isArray(arr) || arr.length === 0) continue
        for (const item of arr) {
          const title = item.shortTitle || item.longTitle || item.title || item.name || ''
          if (!title) continue

          // Price: try amountValue (string like "500 SEK"), estimate, currentBid
          let price = 0
          if (item.amountValue) {
            price = extractPrice(String(item.amountValue))
          }
          if (!price && item.estimate) {
            price = typeof item.estimate === 'number' ? item.estimate : extractPrice(String(item.estimate))
          }
          if (!price && item.currentBid) {
            price = typeof item.currentBid === 'number' ? item.currentBid : extractPrice(String(item.currentBid))
          }

          if (price <= 0) continue

          const imageUrl = item.mainImageUrl || item.imageUrl || item.image || ''
          const itemUrl = item.url
            ? (item.url.startsWith('http') ? item.url : `https://auctionet.com${item.url}`)
            : (item.id ? `https://auctionet.com/sv/${item.id}` : '')

          items.push({
            title,
            artist: item.artist || item.maker || 'Okänd konstnär',
            price,
            imageUrl,
            url: itemUrl,
            source,
            description: item.description || `Utrop: ${item.estimate || ''} ${item.currency || 'SEK'}`,
            category: type,
          })
        }
        if (items.length > 0) break
      }
    } catch {
      // skip unparseable props
    }
  })

  return items
}

async function scrapeAuctionet(type: string): Promise<ScrapedItem[]> {
  const query = type === 'sculptures' ? 'skulptur' : 'tavla'
  const url = `https://auctionet.com/sv/search?q=${query}`

  try {
    console.log(`[Auctionet] Fetching ${url}`)
    const { data: html } = await axios.get(url, { headers: HEADERS, timeout: 15000 })
    const items = parseAuctionetReactProps(html, 'Auctionet', type)
    console.log(`[Auctionet] Found ${items.length} items`)
    return items
  } catch (error: any) {
    console.error(`[Auctionet] Error: ${error.message}`)
    return []
  }
}

// ─── Stockholms Auktionsverk (Auctionet med company_id) ─────────

async function scrapeStockholmsAuktionsverk(type: string): Promise<ScrapedItem[]> {
  const query = type === 'sculptures' ? 'skulptur' : 'tavla'
  const url = `https://auctionet.com/sv/search?company_id=242&q=${query}`

  try {
    console.log(`[Stockholms Auktionsverk] Fetching via Auctionet: ${url}`)
    const { data: html } = await axios.get(url, { headers: HEADERS, timeout: 15000 })
    const items = parseAuctionetReactProps(html, 'Stockholms Auktionsverk', type)
    console.log(`[Stockholms Auktionsverk] Found ${items.length} items`)
    return items
  } catch (error: any) {
    console.error(`[Stockholms Auktionsverk] Error: ${error.message}`)
    return []
  }
}

// ─── Barnebys (__NEXT_DATA__ Redux store) ───────────────────────

async function scrapeBarnebys(type: string): Promise<ScrapedItem[]> {
  const category = type === 'sculptures' ? 'skulpturer' : 'maleri'
  const url = `https://www.barnebys.se/auktioner/${category}`

  try {
    console.log(`[Barnebys] Fetching ${url}`)
    const { data: html } = await axios.get(url, { headers: HEADERS, timeout: 15000 })
    const $ = cheerio.load(html)
    const items: ScrapedItem[] = []

    // Barnebys SSRs item data inside __NEXT_DATA__ -> __redux.search.resultState
    const nextDataScript = $('#__NEXT_DATA__').html()
    if (nextDataScript) {
      try {
        const nextData = JSON.parse(nextDataScript)
        const redux = nextData?.props?.__redux || nextData?.props?.pageProps?.__redux
        const rawResults = redux?.search?.resultState?.rawResults
        const hits = rawResults?.[0]?.hits || []

        for (const hit of hits) {
          const titleObj = hit.i18n?.sv_SE || hit.i18n?.en_US || {}
          const title = titleObj.title || hit.title || hit.name || ''
          if (!title) continue

          // Price object has multiple currencies
          let price = 0
          if (hit.price?.SEK) {
            price = Math.round(hit.price.SEK)
          } else if (hit.priceO?.p) {
            // Convert from original currency (often EUR)
            const origPrice = hit.priceO.p
            const currency = hit.priceO.c
            if (currency === 'SEK') price = Math.round(origPrice)
            else if (currency === 'EUR') price = Math.round(origPrice * 11.5)
            else if (currency === 'USD') price = Math.round(origPrice * 10.5)
            else if (currency === 'GBP') price = Math.round(origPrice * 13.5)
            else if (currency === 'DKK') price = Math.round(origPrice * 1.55)
            else if (currency === 'NOK') price = Math.round(origPrice * 1.0)
            else price = Math.round(origPrice * 11) // fallback
          }

          if (price <= 0) continue

          const imageUrl = hit.img || ''
          const itemUrl = hit.url || ''
          const auctionHouse = hit.ah || 'Okänt auktionshus'
          const description = titleObj.desc || hit.description || ''

          items.push({
            title,
            artist: auctionHouse,
            price,
            imageUrl,
            url: itemUrl,
            source: 'Barnebys',
            description,
            category: type,
          })
        }
      } catch (e) {
        console.log('[Barnebys] Could not parse __NEXT_DATA__:', e)
      }
    }

    // Fallback: JSON-LD
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
              items.push({ title, artist: item?.brand?.name || 'Okänd konstnär', price, imageUrl: item?.image || '', url: item?.url || '', source: 'Barnebys', description: item?.description || '', category: type })
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

// ─── Tradera (HTML card parsing) ────────────────────────────────

async function scrapeTradera(type: string): Promise<ScrapedItem[]> {
  // Use ASCII-only queries — Tradera returns 400 on non-ASCII
  const query = type === 'sculptures' ? 'skulptur+konst' : 'tavla+konst'
  const url = `https://www.tradera.com/search?q=${query}&categoryId=302020`

  try {
    console.log(`[Tradera] Fetching ${url}`)
    const { data: html } = await axios.get(url, { headers: HEADERS, timeout: 15000 })
    const $ = cheerio.load(html)
    const items: ScrapedItem[] = []

    // Tradera renders item cards in HTML with links to /item/
    // Try multiple selector strategies for the item cards
    $('a[href*="/item/"]').each((_, el) => {
      const $el = $(el)
      const href = $el.attr('href') || ''
      // Skip navigation/header links — real item links are longer
      if (href.split('/').length < 4) return

      const title = $el.find('h3, h4, [class*="title"], [class*="Title"]').first().text().trim()
        || $el.text().trim().slice(0, 100)
      if (!title || title.length < 3) return

      const priceText = $el.find('[class*="price"], [class*="Price"]').first().text().trim()
      const price = extractPrice(priceText)
      if (price <= 0) return

      const img = $el.find('img').first()
      const imageUrl = img.attr('src') || img.attr('data-src') || ''
      const itemUrl = href.startsWith('http') ? href : `https://www.tradera.com${href}`

      items.push({
        title: title.length > 120 ? title.slice(0, 120) + '…' : title,
        artist: 'Okänd konstnär',
        price,
        imageUrl,
        url: itemUrl,
        source: 'Tradera',
        description: priceText,
        category: type,
      })
    })

    // Deduplicate by URL
    const seen = new Set<string>()
    const dedupedItems = items.filter(item => {
      if (seen.has(item.url)) return false
      seen.add(item.url)
      return true
    })

    // Fallback: __NEXT_DATA__
    if (dedupedItems.length === 0) {
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
              dedupedItems.push({ title: item.title || item.shortDescription || '', artist: 'Okänd konstnär', price, imageUrl: item.imageUrl || item.thumbnailUrl || '', url: item.itemUrl || `https://www.tradera.com/item/${item.id}`, source: 'Tradera', description: item.description || '', category: type })
            }
          }
        } catch {
          console.log('[Tradera] Could not parse __NEXT_DATA__')
        }
      }
    }

    console.log(`[Tradera] Found ${dedupedItems.length} items`)
    return dedupedItems
  } catch (error: any) {
    console.error(`[Tradera] Error: ${error.message}`)
    return []
  }
}

// ─── Lauritz (currently broken — all search URLs return 404) ────

async function scrapeLauritz(type: string): Promise<ScrapedItem[]> {
  // Lauritz search is broken for HTTP requests (all URL patterns return 404)
  // Keep a minimal attempt in case they fix it
  const query = type === 'sculptures' ? 'skulptur' : 'maleri'
  const urls = [
    `https://www.lauritz.com/sv/sok?q=${query}`,
    `https://www.lauritz.com/sv/search?q=${query}`,
    `https://www.lauritz.com/en/search?q=${query}`,
  ]

  for (const url of urls) {
    try {
      console.log(`[Lauritz] Trying ${url}`)
      const { data: html, status } = await axios.get(url, { headers: HEADERS, timeout: 10000, validateStatus: () => true })
      if (status !== 200) continue

      const $ = cheerio.load(html)
      const items: ScrapedItem[] = []

      // Try __NEXT_DATA__
      const nextDataScript = $('#__NEXT_DATA__').html()
      if (nextDataScript) {
        try {
          const nextData = JSON.parse(nextDataScript)
          const props = nextData?.props?.pageProps
          const lots = props?.lots || props?.items || props?.searchResult?.items || props?.results || []
          for (const lot of Array.isArray(lots) ? lots : []) {
            const title = lot.title || lot.name || ''
            const price = lot.price || lot.currentBid || lot.estimateLow || 0
            if (title && price > 0) {
              items.push({ title, artist: lot.artist || lot.maker || 'Okänd konstnär', price: typeof price === 'number' ? price : extractPrice(String(price)), imageUrl: lot.imageUrl || lot.image || '', url: lot.url || '', source: 'Lauritz', description: lot.description || '', category: type })
            }
          }
        } catch {}
      }

      if (items.length > 0) {
        console.log(`[Lauritz] Found ${items.length} items`)
        return items
      }
    } catch {
      continue
    }
  }

  console.log('[Lauritz] All URLs failed or returned 0 items')
  return []
}

// ─── Catawiki (blocked by Akamai — lots available via Barnebys) ─

async function scrapeCatawiki(type: string): Promise<ScrapedItem[]> {
  const category = type === 'sculptures' ? 'sculptures' : 'paintings'
  const url = `https://www.catawiki.com/en/c/485-${category}`

  try {
    console.log(`[Catawiki] Fetching ${url}`)
    const { data: html, status } = await axios.get(url, {
      headers: HEADERS,
      timeout: 15000,
      validateStatus: () => true,
    })

    if (status === 403) {
      console.log('[Catawiki] Blocked by Akamai (403) — lots available via Barnebys instead')
      return []
    }

    const $ = cheerio.load(html)
    const items: ScrapedItem[] = []

    // If we somehow get through, try JSON-LD and selectors
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const ld = JSON.parse($(el).html() || '')
        const offers = ld?.offers || ld?.itemListElement || []
        for (const offer of Array.isArray(offers) ? offers : [offers]) {
          const item = offer?.item || offer
          const title = item?.name || ''
          const priceVal = parseFloat(item?.price || item?.lowPrice || '0')
          const price = priceVal > 0 ? Math.round(priceVal * 11.5) : 0
          if (title && price > 0) {
            items.push({ title, artist: item?.brand?.name || item?.creator?.name || 'Okänd konstnär', price, imageUrl: item?.image || '', url: item?.url || '', source: 'Catawiki', description: item?.description || '', category: type })
          }
        }
      } catch {}
    })

    console.log(`[Catawiki] Found ${items.length} items`)
    return items
  } catch (error: any) {
    console.error(`[Catawiki] Error: ${error.message}`)
    return []
  }
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
