import { ArtItem } from './scrapers'

export interface PriceAnalysis {
  estimatedValue: number
  profitMargin: number
  riskLevel: 'low' | 'medium' | 'high'
  confidence: number
  marketTrend: 'rising' | 'stable' | 'declining'
  recommendation: 'buy' | 'hold' | 'avoid'
}

export class PriceAnalyzer {
  private static artistMarketData: Record<string, {
    averagePrice: number
    priceHistory: number[]
    trend: number
    volatility: number
  }> = {
    'Carl Larsson': { averagePrice: 120000, priceHistory: [100000, 110000, 115000, 120000], trend: 0.08, volatility: 0.12 },
    'Anders Zorn': { averagePrice: 250000, priceHistory: [200000, 220000, 235000, 250000], trend: 0.11, volatility: 0.15 },
    'Erik Lundberg': { averagePrice: 85000, priceHistory: [70000, 75000, 80000, 85000], trend: 0.10, volatility: 0.18 },
    'Viking Svensson': { averagePrice: 45000, priceHistory: [40000, 42000, 43500, 45000], trend: 0.06, volatility: 0.10 },
    'Arne Nordheim': { averagePrice: 180000, priceHistory: [150000, 160000, 170000, 180000], trend: 0.09, volatility: 0.20 }
  }

  private static getArtistData(artist: string) {
    return this.artistMarketData[artist] || {
      averagePrice: 50000,
      priceHistory: [45000, 47000, 48500, 50000],
      trend: 0.05,
      volatility: 0.15
    }
  }

  static analyzeItem(item: ArtItem): PriceAnalysis {
    const artistData = this.getArtistData(item.artist)
    
    // Beräkna estimerat värde baserat på artistdata
    let estimatedValue = artistData.averagePrice
    
    // Justera baserat på storlek och medium (mock-logik)
    const sizeMultiplier = this.getSizeMultiplier(item.description)
    const mediumMultiplier = this.getMediumMultiplier(item.description)
    const conditionMultiplier = 0.95 // Antag god condition
    
    estimatedValue *= sizeMultiplier * mediumMultiplier * conditionMultiplier
    
    // Lägg till slumpmässig variation
    const randomVariation = 0.9 + Math.random() * 0.2 // 90-110%
    estimatedValue *= randomVariation
    
    // Beräkna vinstmarginal
    const profitMargin = ((estimatedValue - item.price) / item.price) * 100
    
    // Bedöm risk
    const riskLevel = this.assessRisk(artistData.volatility, profitMargin)
    
    // Beräkna confidence
    const confidence = Math.max(0.5, 1 - artistData.volatility)
    
    // Bestäm marknadstrend
    const marketTrend = artistData.trend > 0.05 ? 'rising' : 
                        artistData.trend < -0.05 ? 'declining' : 'stable'
    
    // Ge rekommendation
    const recommendation = this.getRecommendation(profitMargin, riskLevel, confidence)
    
    return {
      estimatedValue: Math.round(estimatedValue),
      profitMargin: Math.round(profitMargin),
      riskLevel,
      confidence: Math.round(confidence * 100) / 100,
      marketTrend,
      recommendation
    }
  }

  private static getSizeMultiplier(description: string): number {
    if (description.includes('100x')) return 1.3
    if (description.includes('80x')) return 1.1
    if (description.includes('60x')) return 1.0
    if (description.includes('50x')) return 0.9
    if (description.includes('40cm')) return 0.8
    return 1.0
  }

  private static getMediumMultiplier(description: string): number {
    if (description.includes('olja')) return 1.2
    if (description.includes('akryl')) return 1.0
    if (description.includes('akvarell')) return 0.8
    if (description.includes('brons')) return 1.3
    if (description.includes('marmor')) return 1.4
    if (description.includes('stål')) return 1.1
    if (description.includes('granit')) return 1.0
    return 1.0
  }

  private static assessRisk(volatility: number, profitMargin: number): 'low' | 'medium' | 'high' {
    if (volatility < 0.1 && profitMargin > 30) return 'low'
    if (volatility < 0.2 && profitMargin > 20) return 'medium'
    return 'high'
  }

  private static getRecommendation(
    profitMargin: number, 
    riskLevel: 'low' | 'medium' | 'high', 
    confidence: number
  ): 'buy' | 'hold' | 'avoid' {
    if (profitMargin > 50 && riskLevel === 'low' && confidence > 0.7) return 'buy'
    if (profitMargin > 30 && riskLevel === 'medium' && confidence > 0.6) return 'buy'
    if (profitMargin < 15 || riskLevel === 'high') return 'avoid'
    return 'hold'
  }

  static analyzePortfolio(items: ArtItem[]) {
    const analyses = items.map(item => this.analyzeItem(item))
    
    const totalInvestment = items.reduce((sum, item) => sum + item.price, 0)
    const totalValue = analyses.reduce((sum, analysis) => sum + analysis.estimatedValue, 0)
    const totalProfit = totalValue - totalInvestment
    const averageMargin = (totalProfit / totalInvestment) * 100
    
    const riskDistribution = analyses.reduce((acc, analysis) => {
      acc[analysis.riskLevel]++
      return acc
    }, {} as Record<string, number>)
    
    const recommendations = analyses.reduce((acc, analysis) => {
      acc[analysis.recommendation]++
      return acc
    }, {} as Record<string, number>)

    return {
      totalItems: items.length,
      totalInvestment,
      totalValue,
      totalProfit,
      averageMargin,
      riskDistribution,
      recommendations,
      topPicks: analyses
        .filter(a => a.recommendation === 'buy')
        .sort((a, b) => b.profitMargin - a.profitMargin)
        .slice(0, 3)
    }
  }
}
