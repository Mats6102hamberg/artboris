import type { Browser, Page } from 'puppeteer'

let browserInstance: Browser | null = null
let stealthApplied = false

const IS_VERCEL = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME

async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.connected) {
    return browserInstance
  }

  const puppeteerExtra = (await import('puppeteer-extra')).default
  if (!stealthApplied) {
    const StealthPlugin = (await import('puppeteer-extra-plugin-stealth')).default
    puppeteerExtra.use(StealthPlugin())
    stealthApplied = true
  }

  if (IS_VERCEL) {
    // Serverless: use @sparticuz/chromium which bundles a Lambda-compatible binary
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const chromium = require('@sparticuz/chromium')

    browserInstance = await puppeteerExtra.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless ?? true,
    })
  } else {
    // Local dev: use system Puppeteer with bundled Chromium
    browserInstance = await puppeteerExtra.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1920,1080',
      ],
    })
  }

  return browserInstance
}

/**
 * Fetch a page's rendered HTML using a headless browser.
 * Uses puppeteer-extra with stealth plugin to bypass bot detection.
 */
export async function fetchWithBrowser(
  url: string,
  waitSelector?: string,
  timeout = 30000
): Promise<string> {
  const browser = await getBrowser()
  let page: Page | null = null

  try {
    page = await browser.newPage()
    await page.setViewport({ width: 1920, height: 1080 })
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'sv-SE,sv;q=0.9,en;q=0.8',
    })

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout,
    })

    if (waitSelector) {
      await page.waitForSelector(waitSelector, { timeout: 10000 }).catch(() => {
        // Selector not found — continue with whatever rendered
      })
    }

    // Small extra wait for late JS rendering
    await new Promise(r => setTimeout(r, 1500))

    const html = await page.content()
    return html
  } finally {
    if (page) {
      await page.close().catch(() => {})
    }
  }
}

/**
 * Close the shared browser instance. Call on server shutdown.
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close().catch(() => {})
    browserInstance = null
  }
}
