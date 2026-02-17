import OpenAI from 'openai'
import { ScrapedItem } from './scrapers'
import { PriceAnalyzer } from './priceAnalyzer'
import { sendAIAdminAlert } from '@/server/services/email/adminAlert'

export interface ValuatedItem extends ScrapedItem {
  estimatedValue: number
  profitMargin: number
  profit: number
  riskLevel: 'low' | 'medium' | 'high'
  confidence: number
  marketTrend: 'rising' | 'stable' | 'declining'
  recommendation: 'buy' | 'hold' | 'avoid'
}

interface AIValuation {
  index: number
  title: string
  estimatedValue: number
  riskLevel: 'low' | 'medium' | 'high'
  confidence: number
  marketTrend: 'rising' | 'stable' | 'declining'
  recommendation: 'buy' | 'hold' | 'avoid'
}

export async function valuateItems(items: ScrapedItem[]): Promise<ValuatedItem[]> {
  if (items.length === 0) return []

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey || apiKey === 'sk-mock-key') {
    console.log('[Valuation] No OpenAI API key, using PriceAnalyzer fallback')
    return fallbackValuation(items)
  }

  try {
    return await aiValuation(items, apiKey)
  } catch (error) {
    console.error('[Valuation] OpenAI failed, using fallback:', error)
    sendAIAdminAlert({
      type: 'fallback_triggered',
      service: 'aiValuation',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    }).catch(() => {})
    return fallbackValuation(items)
  }
}

async function aiValuation(items: ScrapedItem[], apiKey: string): Promise<ValuatedItem[]> {
  const openai = new OpenAI({ apiKey })

  // Batch items in groups of 20 to avoid token limits
  const batchSize = 20
  const valuated: ValuatedItem[] = []

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const itemList = batch.map((item, idx) => (
      `${idx + 1}. "${item.title}" av ${item.artist} — Utropspris: ${item.price} kr — Källa: ${item.source} — ${item.description}`
    )).join('\n')

    const prompt = `Analysera dessa konstverk från svenska auktionssajter och uppskatta marknadsvärde.

${itemList}

Svara ENBART med en JSON-array (ingen markdown, inga kommentarer). Varje objekt ska ha:
- "index": nummer (1-indexerat, matchar listan ovan)
- "estimatedValue": uppskattat marknadsvärde i SEK (heltal)
- "riskLevel": "low", "medium" eller "high"
- "confidence": 0.0–1.0 (hur säker du är)
- "marketTrend": "rising", "stable" eller "declining"
- "recommendation": "buy", "hold" eller "avoid"

Basera uppskattningen på:
- Konstnärens marknadsvärde och historiska priser
- Teknik och medium
- Aktuella trender på den nordiska konstmarknaden
- Skillnaden mellan utropspris och verkligt marknadsvärde

Var realistisk. Markera "avoid" om utropspriset redan är högt relativt marknadsvärdet.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Du är en expert på den nordiska konstmarknaden med djup kunskap om auktionspriser, konstnärsvärderingar och marknadstrender. Du svarar alltid med ren JSON utan markdown-formatering.'
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2000,
      temperature: 0.3,
    })

    const responseText = completion.choices[0]?.message?.content || '[]'

    // Parse JSON from response (handle potential markdown wrapping)
    let valuations: AIValuation[] = []
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        valuations = JSON.parse(jsonMatch[0])
      }
    } catch (parseErr) {
      console.error('[Valuation] Failed to parse AI response:', responseText.slice(0, 200))
    }

    for (let j = 0; j < batch.length; j++) {
      const item = batch[j]
      const val = valuations.find(v => v.index === j + 1) || null

      if (val && val.estimatedValue > 0) {
        const profit = val.estimatedValue - item.price
        const profitMargin = Math.round((profit / item.price) * 100)
        valuated.push({
          ...item,
          estimatedValue: val.estimatedValue,
          profit,
          profitMargin,
          riskLevel: val.riskLevel || 'medium',
          confidence: val.confidence || 0.5,
          marketTrend: val.marketTrend || 'stable',
          recommendation: val.recommendation || 'hold',
        })
      } else {
        // Fallback for items AI didn't respond to
        const fb = fallbackSingle(item)
        valuated.push(fb)
      }
    }
  }

  console.log(`[Valuation] AI valued ${valuated.length} items`)
  return valuated
}

function fallbackValuation(items: ScrapedItem[]): ValuatedItem[] {
  return items.map(item => fallbackSingle(item))
}

function fallbackSingle(item: ScrapedItem): ValuatedItem {
  const analysis = PriceAnalyzer.analyzeItem({
    title: item.title,
    artist: item.artist,
    price: item.price,
    estimatedValue: 0,
    profitMargin: 0,
    source: item.source,
    imageUrl: item.imageUrl,
    description: item.description,
  })

  const profit = analysis.estimatedValue - item.price

  return {
    ...item,
    estimatedValue: analysis.estimatedValue,
    profit,
    profitMargin: analysis.profitMargin,
    riskLevel: analysis.riskLevel,
    confidence: analysis.confidence,
    marketTrend: analysis.marketTrend,
    recommendation: analysis.recommendation,
  }
}
