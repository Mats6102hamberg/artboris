import type { Metadata } from 'next'
import PhotoTransformClient from './PhotoTransformClient'

export const metadata: Metadata = {
  title: 'Photo Transform — Förvandla ditt foto till konst',
  description: 'Ladda upp ditt eget foto och förvandla det till väggkonst med AI. Välj stil, storlek och ram.',
}

export default function Page() {
  return <PhotoTransformClient />
}
