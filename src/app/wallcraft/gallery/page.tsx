import type { Metadata } from 'next'
import GalleryClient from './GalleryClient'

export const metadata: Metadata = {
  title: 'Galleri — Upptäck AI-genererade konstverk',
  description: 'Utforska galleri med AI-genererade konstverk. Hitta inspiration och prova tavlor på din vägg.',
}

export default function Page() {
  return <GalleryClient />
}
