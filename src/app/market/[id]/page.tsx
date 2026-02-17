import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import ListingClient from './ListingClient'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const listing = await prisma.artworkListing.findUnique({
    where: { id },
    include: { artist: { select: { displayName: true } } },
  })

  if (!listing) {
    return { title: 'Konstverk ej hittat' }
  }

  return {
    title: `${listing.title} av ${listing.artist.displayName}`,
    description: listing.description || `${listing.title} — ${listing.technique} av ${listing.artist.displayName}`,
    openGraph: {
      images: listing.imageUrl ? [{ url: listing.imageUrl }] : [],
    },
  }
}

export default function Page() {
  return <ListingClient />
}
