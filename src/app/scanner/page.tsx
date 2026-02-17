import type { Metadata } from 'next'
import ScannerClient from './ScannerClient'

export const metadata: Metadata = {
  title: 'Art Scanner — Hitta undervärderade konstverk',
  description: 'Skanna auktionshusen och hitta undervärderade konstverk med vinstpotential. AI-driven prisanalys.',
}

export default function Page() {
  return <ScannerClient />
}
