'use client'

import { useState } from 'react'

export default function TermsPage() {
  const [isSv, setIsSv] = useState(true)

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <nav className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
        <a href="/" className="text-lg font-semibold tracking-widest uppercase text-gray-900">
          Artboris
        </a>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSv(!isSv)}
            className="text-xs font-medium text-gray-400 hover:text-gray-900 transition-colors"
          >
            {isSv ? 'English' : 'Svenska'}
          </button>
          <a href="/wallcraft" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            {isSv ? 'Tillbaka till Wallcraft' : 'Back to Wallcraft'}
          </a>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-light text-gray-900 mb-2">
          {isSv ? 'Användarvillkor' : 'Terms of Service'}
        </h1>
        <p className="text-sm text-gray-400 mb-10">
          {isSv ? 'Senast uppdaterad: februari 2026' : 'Last updated: February 2026'}
        </p>

        {/* Section 1: General */}
        <section className="mb-10">
          <h2 className="text-lg font-medium text-gray-900 mb-3">
            {isSv ? '1. Allmänt' : '1. General'}
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            {isSv
              ? 'Dessa villkor gäller för alla tjänster som tillhandahålls av Artboris AB ("Artboris", "vi", "oss") via artboris.com och tillhörande plattformar. Genom att använda våra tjänster godkänner du dessa villkor.'
              : 'These terms apply to all services provided by Artboris AB ("Artboris", "we", "us") via artboris.com and associated platforms. By using our services, you agree to these terms.'}
          </p>
        </section>

        {/* Section 2: Account */}
        <section className="mb-10">
          <h2 className="text-lg font-medium text-gray-900 mb-3">
            {isSv ? '2. Konto och registrering' : '2. Account and Registration'}
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            {isSv
              ? 'Du kan använda vissa funktioner utan konto. Vid registrering ansvarar du för att hålla dina inloggningsuppgifter säkra. Du måste vara minst 18 år eller ha vårdnadshavares samtycke.'
              : 'You may use certain features without an account. When registering, you are responsible for keeping your login credentials secure. You must be at least 18 years old or have parental consent.'}
          </p>
        </section>

        {/* Section 3: Purchases */}
        <section className="mb-10">
          <h2 className="text-lg font-medium text-gray-900 mb-3">
            {isSv ? '3. Köp och leverans' : '3. Purchases and Delivery'}
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            {isSv
              ? 'Alla priser anges i SEK inklusive moms om inget annat anges. Betalning sker via Stripe. Leverans sker inom Sverige via vår tryckpartner. Ångerrätt gäller enligt svensk konsumentlagstiftning (14 dagar) för standardprodukter. Specialtillverkade produkter undantas från ångerrätten.'
              : 'All prices are listed in SEK including VAT unless otherwise stated. Payment is processed via Stripe. Delivery is within Sweden through our print partner. Right of withdrawal applies according to Swedish consumer law (14 days) for standard products. Custom-made products are exempt from the right of withdrawal.'}
          </p>
        </section>

        {/* Section 4: AI-Generated Designs — the key section */}
        <section className="mb-10 bg-purple-50/60 border border-purple-200/40 rounded-xl p-6">
          <h2 className="text-lg font-medium text-purple-900 mb-3">
            {isSv ? '4. AI-genererade motiv' : '4. AI-Generated Designs'}
          </h2>
          <div className="space-y-3 text-sm text-purple-800/90 leading-relaxed">
            <p>
              {isSv
                ? 'AI-genererade motiv som skapas i ArtBoris studio produceras inom ArtBoris plattform.'
                : 'AI-generated designs created in the ArtBoris studio are produced within the ArtBoris platform.'}
            </p>
            <p>
              {isSv
                ? 'Vid köp erhåller kunden en fysisk produkt för privat bruk.'
                : 'Upon purchase, the customer receives a physical product for personal use.'}
            </p>
            <p>
              {isSv
                ? 'ArtBoris förbehåller sig rätten att visa AI-genererade motiv i sitt galleri, marknadsföring och i plattformen.'
                : 'ArtBoris reserves the right to display AI-generated designs in its gallery, marketing, and within the platform.'}
            </p>
          </div>
        </section>

        {/* Section 5: User-Created Content */}
        <section className="mb-10">
          <h2 className="text-lg font-medium text-gray-900 mb-3">
            {isSv ? '5. Användargenererat innehåll' : '5. User-Generated Content'}
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            {isSv
              ? 'Konstverk som laddas upp av konstnärer till Art Market tillhör konstnären. Artboris agerar som marknadsplats och tar en provision vid försäljning. Konstnären ger Artboris rätt att visa verket i marknadsföringssyfte.'
              : 'Artworks uploaded by artists to Art Market belong to the artist. Artboris acts as a marketplace and takes a commission on sales. The artist grants Artboris the right to display the work for marketing purposes.'}
          </p>
        </section>

        {/* Section 6: Privacy */}
        <section className="mb-10">
          <h2 className="text-lg font-medium text-gray-900 mb-3">
            {isSv ? '6. Integritet' : '6. Privacy'}
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            {isSv
              ? 'Vi behandlar personuppgifter i enlighet med GDPR. Rumsfoton som laddas upp för "prova på vägg"-funktionen lagras tillfälligt och raderas automatiskt. Se vår integritetspolicy för fullständig information.'
              : 'We process personal data in accordance with GDPR. Room photos uploaded for the "try on wall" feature are stored temporarily and automatically deleted. See our privacy policy for full details.'}
          </p>
        </section>

        {/* Section 7: Limitation */}
        <section className="mb-10">
          <h2 className="text-lg font-medium text-gray-900 mb-3">
            {isSv ? '7. Ansvarsbegränsning' : '7. Limitation of Liability'}
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            {isSv
              ? 'Artboris ansvarar inte för färgavvikelser mellan skärm och tryck. AI-genererade motiv kan variera och vi garanterar inte specifika resultat. Vår maximala ersättningsskyldighet begränsas till det belopp kunden betalat.'
              : 'Artboris is not liable for color differences between screen and print. AI-generated designs may vary and we do not guarantee specific results. Our maximum liability is limited to the amount paid by the customer.'}
          </p>
        </section>

        {/* Section 8: Contact */}
        <section className="mb-10">
          <h2 className="text-lg font-medium text-gray-900 mb-3">
            {isSv ? '8. Kontakt' : '8. Contact'}
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            {isSv
              ? 'Artboris AB — kontakta oss via hello@artboris.com för frågor om dessa villkor.'
              : 'Artboris AB — contact us at hello@artboris.com for questions about these terms.'}
          </p>
        </section>

        <footer className="border-t border-gray-200/60 pt-8 mt-12">
          <p className="text-xs text-gray-400 text-center">
            © {new Date().getFullYear()} Artboris AB
          </p>
        </footer>
      </main>
    </div>
  )
}
