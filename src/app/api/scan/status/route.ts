import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Kontrollera om Puppeteer är tillgängligt
    const puppeteerStatus = await checkPuppeteerStatus()
    
    return NextResponse.json({
      status: 'operational',
      puppeteer: puppeteerStatus,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      scrapingCapabilities: {
        bukowskis: 'enabled',
        lauritz: 'enabled', 
        barnebys: 'enabled'
      }
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

async function checkPuppeteerStatus(): Promise<string> {
  try {
    const puppeteer = require('puppeteer-extra')
    return 'available'
  } catch (error) {
    return 'not_available'
  }
}
