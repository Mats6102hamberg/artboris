'use client'

import { useState } from 'react'

type Lang = 'sv' | 'en' | 'de'
type Texts = Record<Lang, string>

const LANG_LABELS: Record<Lang, string> = { sv: 'SV', en: 'EN', de: 'DE' }
const LANGS: Lang[] = ['sv', 'en', 'de']

export default function TermsPage() {
  const [lang, setLang] = useState<Lang>('sv')
  const t = (texts: Texts) => texts[lang]

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <nav className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
        <a href="/" className="text-lg font-semibold tracking-widest uppercase text-gray-900">
          Artboris
        </a>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {LANGS.map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  lang === l ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {LANG_LABELS[l]}
              </button>
            ))}
          </div>
          <a href="/wallcraft" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            {t({ sv: 'Tillbaka till Wallcraft', en: 'Back to Wallcraft', de: 'Zurück zu Wallcraft' })}
          </a>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-light text-gray-900 mb-2">
          {t({ sv: 'Användarvillkor', en: 'Terms of Service', de: 'Nutzungsbedingungen' })}
        </h1>
        <p className="text-sm text-gray-400 mb-10">
          {t({ sv: 'Senast uppdaterad: februari 2026', en: 'Last updated: February 2026', de: 'Zuletzt aktualisiert: Februar 2026' })}
        </p>

        {/* Section 1: General */}
        <section className="mb-10">
          <h2 className="text-lg font-medium text-gray-900 mb-3">
            {t({ sv: '1. Allmänt', en: '1. General', de: '1. Allgemeines' })}
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            {t({
              sv: 'Dessa villkor gäller för alla tjänster som tillhandahålls av Artboris AB ("Artboris", "vi", "oss") via artboris.com och tillhörande plattformar. Genom att använda våra tjänster godkänner du dessa villkor.',
              en: 'These terms apply to all services provided by Artboris AB ("Artboris", "we", "us") via artboris.com and associated platforms. By using our services, you agree to these terms.',
              de: 'Diese Bedingungen gelten für alle Dienste, die von Artboris AB („Artboris", „wir", „uns") über artboris.com und zugehörige Plattformen bereitgestellt werden. Durch die Nutzung unserer Dienste stimmst du diesen Bedingungen zu.',
            })}
          </p>
        </section>

        {/* Section 2: Account */}
        <section className="mb-10">
          <h2 className="text-lg font-medium text-gray-900 mb-3">
            {t({ sv: '2. Konto och registrering', en: '2. Account and Registration', de: '2. Konto und Registrierung' })}
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            {t({
              sv: 'Du kan använda vissa funktioner utan konto. Vid registrering ansvarar du för att hålla dina inloggningsuppgifter säkra. Du måste vara minst 18 år eller ha vårdnadshavares samtycke.',
              en: 'You may use certain features without an account. When registering, you are responsible for keeping your login credentials secure. You must be at least 18 years old or have parental consent.',
              de: 'Du kannst bestimmte Funktionen ohne Konto nutzen. Bei der Registrierung bist du für die Sicherheit deiner Anmeldedaten verantwortlich. Du musst mindestens 18 Jahre alt sein oder die Zustimmung eines Erziehungsberechtigten haben.',
            })}
          </p>
        </section>

        {/* Section 3: Purchases */}
        <section className="mb-10">
          <h2 className="text-lg font-medium text-gray-900 mb-3">
            {t({ sv: '3. Köp och leverans', en: '3. Purchases and Delivery', de: '3. Kauf und Lieferung' })}
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            {t({
              sv: 'Alla priser anges i SEK inklusive moms om inget annat anges. Betalning sker via Stripe. Leverans sker inom Sverige via vår tryckpartner. Ångerrätt gäller enligt svensk konsumentlagstiftning (14 dagar) för standardprodukter. Specialtillverkade produkter undantas från ångerrätten.',
              en: 'All prices are listed in SEK including VAT unless otherwise stated. Payment is processed via Stripe. Delivery is within Sweden through our print partner. Right of withdrawal applies according to Swedish consumer law (14 days) for standard products. Custom-made products are exempt from the right of withdrawal.',
              de: 'Alle Preise sind in SEK inklusive Mehrwertsteuer angegeben, sofern nicht anders vermerkt. Die Zahlung erfolgt über Stripe. Die Lieferung erfolgt innerhalb Schwedens über unseren Druckpartner. Das Widerrufsrecht gilt gemäß schwedischem Verbraucherrecht (14 Tage) für Standardprodukte. Maßgefertigte Produkte sind vom Widerrufsrecht ausgenommen.',
            })}
          </p>
        </section>

        {/* Section 4: AI-Generated Designs — the key section */}
        <section className="mb-10 bg-purple-50/60 border border-purple-200/40 rounded-xl p-6">
          <h2 className="text-lg font-medium text-purple-900 mb-3">
            {t({ sv: '4. AI-genererade motiv', en: '4. AI-Generated Designs', de: '4. KI-generierte Motive' })}
          </h2>
          <div className="space-y-3 text-sm text-purple-800/90 leading-relaxed">
            <p>
              {t({
                sv: 'AI-genererade motiv som skapas i ArtBoris studio produceras inom ArtBoris plattform.',
                en: 'AI-generated designs created in the ArtBoris studio are produced within the ArtBoris platform.',
                de: 'KI-generierte Motive, die im ArtBoris Studio erstellt werden, werden innerhalb der ArtBoris-Plattform produziert.',
              })}
            </p>
            <p>
              {t({
                sv: 'Vid köp erhåller kunden en fysisk produkt för privat bruk.',
                en: 'Upon purchase, the customer receives a physical product for personal use.',
                de: 'Beim Kauf erhält der Kunde ein physisches Produkt für den privaten Gebrauch.',
              })}
            </p>
            <p>
              {t({
                sv: 'ArtBoris förbehåller sig rätten att visa AI-genererade motiv i sitt galleri, marknadsföring och i plattformen.',
                en: 'ArtBoris reserves the right to display AI-generated designs in its gallery, marketing, and within the platform.',
                de: 'ArtBoris behält sich das Recht vor, KI-generierte Motive in seiner Galerie, im Marketing und auf der Plattform anzuzeigen.',
              })}
            </p>
          </div>
        </section>

        {/* Section 5: User-Created Content */}
        <section className="mb-10">
          <h2 className="text-lg font-medium text-gray-900 mb-3">
            {t({ sv: '5. Användargenererat innehåll', en: '5. User-Generated Content', de: '5. Nutzergenerierte Inhalte' })}
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            {t({
              sv: 'Konstverk som laddas upp av konstnärer till Art Market tillhör konstnären. Artboris agerar som marknadsplats och tar en provision vid försäljning. Konstnären ger Artboris rätt att visa verket i marknadsföringssyfte.',
              en: 'Artworks uploaded by artists to Art Market belong to the artist. Artboris acts as a marketplace and takes a commission on sales. The artist grants Artboris the right to display the work for marketing purposes.',
              de: 'Kunstwerke, die von Künstlern auf den Art Market hochgeladen werden, gehören dem Künstler. Artboris fungiert als Marktplatz und erhebt eine Provision beim Verkauf. Der Künstler gewährt Artboris das Recht, das Werk zu Marketingzwecken anzuzeigen.',
            })}
          </p>
        </section>

        {/* Section 6: Privacy */}
        <section className="mb-10">
          <h2 className="text-lg font-medium text-gray-900 mb-3">
            {t({ sv: '6. Integritet', en: '6. Privacy', de: '6. Datenschutz' })}
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            {t({
              sv: 'Vi behandlar personuppgifter i enlighet med GDPR. Rumsfoton som laddas upp för "prova på vägg"-funktionen lagras tillfälligt och raderas automatiskt. Se vår integritetspolicy för fullständig information.',
              en: 'We process personal data in accordance with GDPR. Room photos uploaded for the "try on wall" feature are stored temporarily and automatically deleted. See our privacy policy for full details.',
              de: 'Wir verarbeiten personenbezogene Daten gemäß der DSGVO. Raumfotos, die für die „An der Wand testen"-Funktion hochgeladen werden, werden vorübergehend gespeichert und automatisch gelöscht. Weitere Informationen findest du in unserer Datenschutzerklärung.',
            })}
          </p>
        </section>

        {/* Section 7: Limitation */}
        <section className="mb-10">
          <h2 className="text-lg font-medium text-gray-900 mb-3">
            {t({ sv: '7. Ansvarsbegränsning', en: '7. Limitation of Liability', de: '7. Haftungsbeschränkung' })}
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            {t({
              sv: 'Artboris ansvarar inte för färgavvikelser mellan skärm och tryck. AI-genererade motiv kan variera och vi garanterar inte specifika resultat. Vår maximala ersättningsskyldighet begränsas till det belopp kunden betalat.',
              en: 'Artboris is not liable for color differences between screen and print. AI-generated designs may vary and we do not guarantee specific results. Our maximum liability is limited to the amount paid by the customer.',
              de: 'Artboris haftet nicht für Farbabweichungen zwischen Bildschirm und Druck. KI-generierte Motive können variieren und wir garantieren keine bestimmten Ergebnisse. Unsere maximale Haftung beschränkt sich auf den vom Kunden gezahlten Betrag.',
            })}
          </p>
        </section>

        {/* Section 8: Contact */}
        <section className="mb-10">
          <h2 className="text-lg font-medium text-gray-900 mb-3">
            {t({ sv: '8. Kontakt', en: '8. Contact', de: '8. Kontakt' })}
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            {t({
              sv: 'Artboris AB — kontakta oss via hello@artboris.com för frågor om dessa villkor.',
              en: 'Artboris AB — contact us at hello@artboris.com for questions about these terms.',
              de: 'Artboris AB — kontaktiere uns unter hello@artboris.com bei Fragen zu diesen Bedingungen.',
            })}
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
