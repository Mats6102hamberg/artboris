import type { Metadata } from 'next'
import PosterLabClient from './PosterLabClient'

export const metadata: Metadata = {
  title: 'Poster Lab — Skapa och beställ posters',
  description: 'Skapa unika posters med AI. Välj storlek, ram och beställ tryck direkt hem.',
}

export default function Page() {
  return <PosterLabClient />
}
