import type { Metadata } from 'next'
import MarketClient from './MarketClient'

export const metadata: Metadata = {
  title: 'Art Market — Upptäck unik konst',
  description: 'Upptäck unik konst från lokala konstnärer. Prova verket på din vägg innan du köper.',
}

export default function Page() {
  return <MarketClient />
}
