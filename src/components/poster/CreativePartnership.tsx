'use client'

import { useState } from 'react'
import Link from 'next/link'

interface CreativePartnershipProps {
  accepted: boolean
  onAccept: () => void
}

export default function CreativePartnership({ accepted, onAccept }: CreativePartnershipProps) {
  const [expanded, setExpanded] = useState(false)

  if (accepted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-green-900">Creative Partnership aktiverat</p>
            <p className="text-xs text-green-700 mt-0.5">Du tjänar 30% royalty på varje försäljning av ditt motiv</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200/60 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-purple-900">ArtBoris Creative Partnership</h3>
            <p className="text-xs text-purple-600">Tjäna pengar på ditt motiv</p>
          </div>
        </div>

        <p className="text-sm text-purple-800/90 leading-relaxed mb-4">
          Vi använder vår avancerade motor för att skala upp, detaljstyra och stilisera ditt motiv till ett unikt ArtBoris-original med gallerikvalitet.
        </p>

        {/* Benefits */}
        <div className="space-y-2.5 mb-4">
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-purple-200/60 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-purple-700 text-[10px] font-bold">%</span>
            </div>
            <div>
              <p className="text-sm font-medium text-purple-900">Livslång Royalty</p>
              <p className="text-xs text-purple-700">Du får 30% av nettovinsten på varje såld tavla med ditt motiv.</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-purple-200/60 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-purple-900">Gallerikvalitet</p>
              <p className="text-xs text-purple-700">Vi garanterar att bilden optimeras för storformatstryck.</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-purple-200/60 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-purple-900">Verifierad Äkthet</p>
              <p className="text-xs text-purple-700">Ditt bidrag säkras i vårt system för att skydda mot kopiering.</p>
            </div>
          </div>
        </div>

        {/* Expandable legal details */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-800 transition-colors mb-4"
        >
          <svg className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {expanded ? 'Dölj villkor' : 'Visa fullständiga villkor'}
        </button>

        {expanded && (
          <div className="bg-white/60 rounded-xl p-4 mb-4 text-xs text-purple-800/80 leading-relaxed space-y-3 border border-purple-200/40">
            <div>
              <p className="font-semibold text-purple-900 mb-1">§1. Rättighetsövergång för förädlade verk</p>
              <p>
                Genom att skicka in en bild för förbättring via ArtBoris plattform bekräftar kunden att den äger originalrätten till motivet eller har tillstånd att använda det. Vid genomförd digital förbättring skapas ett bearbetat verk. Kunden överlåter härmed oåterkalleligt alla immateriella rättigheter, inklusive upphovsrätt och nyttjanderätt, för den förbättrade versionen till ArtBoris. Kunden behåller äganderätten till sitt inskickade original.
              </p>
            </div>
            <div>
              <p className="font-semibold text-purple-900 mb-1">§2. Vinstdelning och Utbetalning</p>
              <p>
                Beräkningsgrund: (Försäljningspris exkl. moms) minus (direkta produktionskostnader, frakt, transaktionsavgifter samt fast administrationsavgift om 10 SEK per order). Fördelning: Kunden erhåller 30% av kvarvarande nettovinst. ArtBoris erhåller 70%. Utbetalning sker kvartalsvis när intjänat belopp överstiger 200 SEK.
              </p>
            </div>
            <div>
              <p className="font-semibold text-purple-900 mb-1">§3. Exklusivitet och Borttagning</p>
              <p>
                ArtBoris förbehåller sig rätten att neka motiv som inte håller teknisk eller etisk standard. Om kunden väljer att avsluta sitt konto upphör rätten till framtida vinstdelning, och ArtBoris har rätt att radera den förädlade bilden eller köpa ut kunden från motivet enligt separat överenskommelse. Den förädlade filen lämnas aldrig ut till kund för externt bruk utan skriftligt godkännande.
              </p>
            </div>
            <p className="text-purple-600">
              <Link href="/terms" className="underline hover:text-purple-800">Läs fullständiga användarvillkor</Link>
            </p>
          </div>
        )}
      </div>

      {/* Accept button */}
      <div className="px-5 pb-5">
        <p className="text-[11px] text-purple-600/80 mb-3 leading-relaxed">
          Genom att klicka på &quot;Förbättra bild&quot; godkänner du att den nya, förädlade versionen av bilden ägs av ArtBoris, samt att du omfattas av vårt vinstdelningsprogram.
        </p>
        <button
          onClick={onAccept}
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
          Förbättra bild &amp; aktivera Partnership
        </button>
      </div>
    </div>
  )
}
