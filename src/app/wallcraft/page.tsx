import type { Metadata } from 'next'
import WallcraftClient from './WallcraftClient'

export const metadata: Metadata = {
  title: 'Wallcraft — AI-genererad väggkonst',
  description: 'Designa AI-genererad väggkonst. Ladda upp ditt rum, välj stil och se tavlan på din vägg i realtid.',
}

export default function Page() {
  return <WallcraftClient />
}
