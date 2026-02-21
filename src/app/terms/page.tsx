'use client'

import { useState } from 'react'

type Lang = 'sv' | 'en' | 'de' | 'fr' | 'nl'
type Texts = Record<Lang, string>

const LANG_LABELS: Record<Lang, string> = { sv: 'SV', en: 'EN', de: 'DE', fr: 'FR', nl: 'NL' }
const LANGS: Lang[] = ['sv', 'en', 'de', 'fr', 'nl']

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
            {t({ sv: 'Tillbaka till Wallcraft', en: 'Back to Wallcraft', de: 'Zurück zu Wallcraft', fr: 'Retour à Wallcraft', nl: 'Terug naar Wallcraft' })}
          </a>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-light text-gray-900 mb-2">
          {t({ sv: 'Användarvillkor', en: 'Terms of Service', de: 'Nutzungsbedingungen', fr: 'Conditions d\'utilisation', nl: 'Gebruiksvoorwaarden' })}
        </h1>
        <p className="text-sm text-gray-400 mb-10">
          {t({ sv: 'Senast uppdaterad: februari 2026', en: 'Last updated: February 2026', de: 'Zuletzt aktualisiert: Februar 2026', fr: 'Dernière mise à jour : février 2026', nl: 'Laatst bijgewerkt: februari 2026' })}
        </p>

        {/* Section 1: General */}
        <section className="mb-10">
          <h2 className="text-lg font-medium text-gray-900 mb-3">
            {t({ sv: '1. Allmänt', en: '1. General', de: '1. Allgemeines', fr: '1. Général', nl: '1. Algemeen' })}
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            {t({
              sv: 'Dessa villkor gäller för alla tjänster som tillhandahålls av Artboris AB ("Artboris", "vi", "oss") via artboris.com och tillhörande plattformar. Genom att använda våra tjänster godkänner du dessa villkor.',
              en: 'These terms apply to all services provided by Artboris AB ("Artboris", "we", "us") via artboris.com and associated platforms. By using our services, you agree to these terms.',
              de: 'Diese Bedingungen gelten für alle Dienste, die von Artboris AB („Artboris“, „wir“, „uns“) über artboris.com und zugehörige Plattformen bereitgestellt werden. Durch die Nutzung unserer Dienste stimmst du diesen Bedingungen zu.',
              fr: 'Ces conditions s\'appliquent à tous les services fournis par Artboris AB (« Artboris », « nous », « nous ») via artboris.com et les plateformes associées. En utilisant nos services, vous acceptez ces conditions.',
              nl: 'Deze voorwaarden zijn van toepassing op alle diensten van Artboris AB ("Artboris", "wij", "ons") via artboris.com en bijbehorende platforms. Door onze diensten te gebruiken ga je akkoord met deze voorwaarden.',
            })}
          </p>
        </section>

        {/* Section 2: Account */}
        <section className="mb-10">
          <h2 className="text-lg font-medium text-gray-900 mb-3">
            {t({ sv: '2. Konto och registrering', en: '2. Account and Registration', de: '2. Konto und Registrierung', fr: '2. Compte et inscription', nl: '2. Account en registratie' })}
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            {t({
              sv: 'Du kan använda vissa funktioner utan konto. Vid registrering ansvarar du för att hålla dina inloggningsuppgifter säkra. Du måste vara minst 18 år eller ha vårdnadshavares samtycke.',
              en: 'You may use certain features without an account. When registering, you are responsible for keeping your login credentials secure. You must be at least 18 years old or have parental consent.',
              de: 'Du kannst bestimmte Funktionen ohne Konto nutzen. Bei der Registrierung bist du für die Sicherheit deiner Anmeldedaten verantwortlich. Du musst mindestens 18 Jahre alt sein oder die Zustimmung eines Erziehungsberechtigten haben.',
              fr: 'Vous pouvez utiliser certaines fonctionnalités sans compte. Lors de l\'inscription, vous êtes responsable de la sécurité de vos identifiants. Vous devez avoir au moins 18 ans ou le consentement d\'un parent.',
              nl: 'Je kunt bepaalde functies zonder account gebruiken. Bij registratie ben je verantwoordelijk voor de veiligheid van je inloggegevens. Je moet minimaal 18 jaar oud zijn of toestemming van een ouder hebben.',
            })}
          </p>
        </section>

        {/* Section 3: Purchases */}
        <section className="mb-10">
          <h2 className="text-lg font-medium text-gray-900 mb-3">
            {t({ sv: '3. Köp och leverans', en: '3. Purchases and Delivery', de: '3. Kauf und Lieferung', fr: '3. Achats et livraison', nl: '3. Aankopen en levering' })}
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            {t({
              sv: 'Alla priser anges i SEK inklusive moms om inget annat anges. Betalning sker via Stripe. Leverans sker inom Sverige via vår tryckpartner. Ångerrätt gäller enligt svensk konsumentlagstiftning (14 dagar) för standardprodukter. Specialtillverkade produkter undantas från ångerrätten.',
              en: 'All prices are listed in SEK including VAT unless otherwise stated. Payment is processed via Stripe. Delivery is within Sweden through our print partner. Right of withdrawal applies according to Swedish consumer law (14 days) for standard products. Custom-made products are exempt from the right of withdrawal.',
              de: 'Alle Preise sind in SEK inklusive Mehrwertsteuer angegeben, sofern nicht anders vermerkt. Die Zahlung erfolgt über Stripe. Die Lieferung erfolgt innerhalb Schwedens über unseren Druckpartner. Das Widerrufsrecht gilt gemäß schwedischem Verbraucherrecht (14 Tage) für Standardprodukte. Maßgefertigte Produkte sind vom Widerrufsrecht ausgenommen.',
              fr: 'Tous les prix sont indiqués en SEK TTC sauf mention contraire. Le paiement est traité via Stripe. La livraison s\'effectue en Suède via notre partenaire d\'impression. Le droit de rétractation s\'applique conformément au droit suédois de la consommation (14 jours) pour les produits standard. Les produits sur mesure sont exclus du droit de rétractation.',
              nl: 'Alle prijzen zijn in SEK inclusief btw tenzij anders vermeld. Betaling verloopt via Stripe. Levering vindt plaats binnen Zweden via onze drukpartner. Herroepingsrecht geldt volgens Zweeds consumentenrecht (14 dagen) voor standaardproducten. Op maat gemaakte producten zijn uitgesloten van het herroepingsrecht.',
            })}
          </p>
        </section>

        {/* Section 4: AI-Generated Designs — the key section */}
        <section className="mb-10 bg-purple-50/60 border border-purple-200/40 rounded-xl p-6">
          <h2 className="text-lg font-medium text-purple-900 mb-3">
            {t({ sv: '4. AI-genererade motiv', en: '4. AI-Generated Designs', de: '4. KI-generierte Motive', fr: '4. Motifs générés par IA', nl: '4. AI-gegenereerde motieven' })}
          </h2>
          <div className="space-y-3 text-sm text-purple-800/90 leading-relaxed">
            <p>
              {t({
                sv: 'AI-genererade motiv som skapas i ArtBoris studio produceras inom ArtBoris plattform.',
                en: 'AI-generated designs created in the ArtBoris studio are produced within the ArtBoris platform.',
                de: 'KI-generierte Motive, die im ArtBoris Studio erstellt werden, werden innerhalb der ArtBoris-Plattform produziert.',
                fr: 'Les motifs générés par IA créés dans le studio ArtBoris sont produits au sein de la plateforme ArtBoris.',
                nl: 'AI-gegenereerde motieven die in de ArtBoris studio worden gemaakt, worden geproduceerd binnen het ArtBoris platform.',
              })}
            </p>
            <p>
              {t({
                sv: 'Vid köp erhåller kunden en fysisk produkt för privat bruk.',
                en: 'Upon purchase, the customer receives a physical product for personal use.',
                de: 'Beim Kauf erhält der Kunde ein physisches Produkt für den privaten Gebrauch.',
                fr: 'Lors de l\'achat, le client reçoit un produit physique pour un usage personnel.',
                nl: 'Bij aankoop ontvangt de klant een fysiek product voor persoonlijk gebruik.',
              })}
            </p>
            <p>
              {t({
                sv: 'ArtBoris förbehåller sig rätten att visa AI-genererade motiv i sitt galleri, marknadsföring och i plattformen.',
                en: 'ArtBoris reserves the right to display AI-generated designs in its gallery, marketing, and within the platform.',
                de: 'ArtBoris behält sich das Recht vor, KI-generierte Motive in seiner Galerie, im Marketing und auf der Plattform anzuzeigen.',
                fr: 'ArtBoris se réserve le droit d\'afficher les motifs générés par IA dans sa galerie, son marketing et sur la plateforme.',
                nl: 'ArtBoris behoudt zich het recht voor om AI-gegenereerde motieven te tonen in zijn galerie, marketing en op het platform.',
              })}
            </p>
          </div>
        </section>

        {/* Section 5: Creative Partnership */}
        <section className="mb-10 bg-purple-50/60 border border-purple-200/40 rounded-xl p-6">
          <h2 className="text-lg font-medium text-purple-900 mb-3">
            {t({ sv: '5. Creative Partnership — Bildförbättring och vinstdelning', en: '5. Creative Partnership — Image Enhancement and Revenue Sharing', de: '5. Creative Partnership — Bildverbesserung und Gewinnbeteiligung', fr: '5. Creative Partnership — Amélioration d\'image et partage des revenus', nl: '5. Creative Partnership — Beeldverbetering en winstdeling' })}
          </h2>
          <div className="space-y-4 text-sm text-purple-800/90 leading-relaxed">
            <div>
              <p className="font-semibold text-purple-900 mb-1">
                {t({ sv: '§1. Rättighetsövergång för förädlade verk', en: '§1. Transfer of Rights for Enhanced Works', de: '§1. Rechteübertragung für veredelte Werke', fr: '§1. Transfert de droits pour les œuvres améliorées', nl: '§1. Overdracht van rechten voor verbeterde werken' })}
              </p>
              <p>
                {t({
                  sv: 'Genom att skicka in en bild för förbättring via ArtBoris plattform bekräftar kunden att den äger originalrätten till motivet eller har tillstånd att använda det. Vid genomförd digital förbättring skapas ett bearbetat verk (Derivative Work). Kunden överlåter härmed oåterkalleligt alla immateriella rättigheter, inklusive upphovsrätt och nyttjanderätt, för den förbättrade versionen till ArtBoris. Kunden behåller äganderätten till sitt inskickade original.',
                  en: 'By submitting an image for enhancement via the ArtBoris platform, the customer confirms ownership of the original rights to the motif or has permission to use it. Upon completed digital enhancement, a Derivative Work is created. The customer hereby irrevocably transfers all intellectual property rights, including copyright and usage rights, for the enhanced version to ArtBoris. The customer retains ownership of their submitted original.',
                  de: 'Durch das Einreichen eines Bildes zur Verbesserung über die ArtBoris-Plattform bestätigt der Kunde, dass er die Originalrechte am Motiv besitzt oder die Erlaubnis zur Nutzung hat. Bei abgeschlossener digitaler Verbesserung wird ein bearbeitetes Werk erstellt. Der Kunde überträgt hiermit unwiderruflich alle geistigen Eigentumsrechte, einschließlich Urheberrecht und Nutzungsrecht, für die verbesserte Version an ArtBoris. Der Kunde behält das Eigentum an seinem eingereichten Original.',
                  fr: 'En soumettant une image pour amélioration via la plateforme ArtBoris, le client confirme qu\'il détient les droits originaux sur le motif ou a l\'autorisation de l\'utiliser. Une fois l\'amélioration numérique terminée, une œuvre dérivée est créée. Le client cède irrévocablement tous les droits de propriété intellectuelle, y compris le droit d\'auteur et le droit d\'utilisation, pour la version améliorée à ArtBoris. Le client conserve la propriété de son original soumis.',
                  nl: 'Door een afbeelding in te dienen voor verbetering via het ArtBoris-platform bevestigt de klant dat hij de originele rechten op het motief bezit of toestemming heeft om het te gebruiken. Bij voltooide digitale verbetering wordt een bewerkt werk gecreëerd. De klant draagt hierbij onherroepelijk alle intellectuele eigendomsrechten, inclusief auteursrecht en gebruiksrecht, voor de verbeterde versie over aan ArtBoris. De klant behoudt het eigendom van het ingediende origineel.',
                })}
              </p>
            </div>
            <div>
              <p className="font-semibold text-purple-900 mb-1">
                {t({ sv: '§2. Vinstdelning och Utbetalning', en: '§2. Revenue Sharing and Payouts', de: '§2. Gewinnbeteiligung und Auszahlung', fr: '§2. Partage des revenus et paiements', nl: '§2. Winstdeling en uitbetalingen' })}
              </p>
              <p>
                {t({
                  sv: 'ArtBoris förbinder sig att dela vinsten från försäljning av motivet. Beräkningsgrund: (Försäljningspris exkl. moms) minus (direkta produktionskostnader, frakt, transaktionsavgifter samt fast administrationsavgift om 10 SEK per order). Fördelning: Kunden erhåller 30% av kvarvarande nettovinst. ArtBoris erhåller 70%. Utbetalning sker kvartalsvis när intjänat belopp överstiger 200 SEK.',
                  en: 'ArtBoris commits to sharing profits from sales of the motif. Calculation basis: (Sale price excl. VAT) minus (direct production costs, shipping, transaction fees, and a fixed administration fee of 10 SEK per order). Distribution: The customer receives 30% of remaining net profit. ArtBoris receives 70%. Payouts are made quarterly when the earned amount exceeds 200 SEK.',
                  de: 'ArtBoris verpflichtet sich, den Gewinn aus dem Verkauf des Motivs zu teilen. Berechnungsgrundlage: (Verkaufspreis ohne MwSt.) minus (direkte Produktionskosten, Versand, Transaktionsgebühren und eine feste Verwaltungsgebühr von 10 SEK pro Bestellung). Verteilung: Der Kunde erhält 30% des verbleibenden Nettogewinns. ArtBoris erhält 70%. Auszahlungen erfolgen vierteljährlich, wenn der verdiente Betrag 200 SEK übersteigt.',
                  fr: 'ArtBoris s\'engage à partager les bénéfices de la vente du motif. Base de calcul : (Prix de vente HT) moins (coûts de production directs, frais de port, frais de transaction et frais d\'administration fixes de 10 SEK par commande). Répartition : Le client reçoit 30% du bénéfice net restant. ArtBoris reçoit 70%. Les paiements sont effectués trimestriellement lorsque le montant gagné dépasse 200 SEK.',
                  nl: 'ArtBoris verbindt zich ertoe de winst uit de verkoop van het motief te delen. Berekeningsgrondslag: (Verkoopprijs excl. btw) minus (directe productiekosten, verzending, transactiekosten en een vaste administratievergoeding van 10 SEK per bestelling). Verdeling: De klant ontvangt 30% van de resterende nettowinst. ArtBoris ontvangt 70%. Uitbetalingen vinden plaats per kwartaal wanneer het verdiende bedrag hoger is dan 200 SEK.',
                })}
              </p>
            </div>
            <div>
              <p className="font-semibold text-purple-900 mb-1">
                {t({ sv: '§3. Exklusivitet och Borttagning', en: '§3. Exclusivity and Removal', de: '§3. Exklusivität und Entfernung', fr: '§3. Exclusivité et suppression', nl: '§3. Exclusiviteit en verwijdering' })}
              </p>
              <p>
                {t({
                  sv: 'ArtBoris förbehåller sig rätten att neka motiv som inte håller teknisk eller etisk standard. Om kunden väljer att avsluta sitt konto hos ArtBoris upphör rätten till framtida vinstdelning, och ArtBoris har rätt att radera den förädlade bilden eller köpa ut kunden från motivet enligt separat överenskommelse. Den förädlade filen lämnas aldrig ut till kund för externt bruk utan skriftligt godkännande.',
                  en: 'ArtBoris reserves the right to reject motifs that do not meet technical or ethical standards. If the customer chooses to close their ArtBoris account, the right to future revenue sharing ceases, and ArtBoris has the right to delete the enhanced image or buy out the customer from the motif by separate agreement. The enhanced file is never released to the customer for external use without written consent.',
                  de: 'ArtBoris behält sich das Recht vor, Motive abzulehnen, die technischen oder ethischen Standards nicht entsprechen. Wenn der Kunde sein ArtBoris-Konto kündigt, erlischt das Recht auf zukünftige Gewinnbeteiligung, und ArtBoris hat das Recht, das verbesserte Bild zu löschen oder den Kunden gemäß separater Vereinbarung auszukaufen. Die verbesserte Datei wird niemals ohne schriftliche Zustimmung an den Kunden für externe Nutzung herausgegeben.',
                  fr: 'ArtBoris se réserve le droit de refuser les motifs qui ne répondent pas aux normes techniques ou éthiques. Si le client choisit de fermer son compte ArtBoris, le droit au partage futur des revenus cesse, et ArtBoris a le droit de supprimer l\'image améliorée ou de racheter le client du motif par accord séparé. Le fichier amélioré n\'est jamais remis au client pour un usage externe sans consentement écrit.',
                  nl: 'ArtBoris behoudt zich het recht voor om motieven af te wijzen die niet voldoen aan technische of ethische normen. Als de klant ervoor kiest zijn ArtBoris-account te sluiten, vervalt het recht op toekomstige winstdeling, en ArtBoris heeft het recht om de verbeterde afbeelding te verwijderen of de klant uit te kopen van het motief volgens afzonderlijke overeenkomst. Het verbeterde bestand wordt nooit aan de klant vrijgegeven voor extern gebruik zonder schriftelijke toestemming.',
                })}
              </p>
            </div>
          </div>
        </section>

        {/* Section 6: User-Created Content */}
        <section className="mb-10">
          <h2 className="text-lg font-medium text-gray-900 mb-3">
            {t({ sv: '6. Användargenererat innehåll', en: '6. User-Generated Content', de: '6. Nutzergenerierte Inhalte', fr: '6. Contenu généré par les utilisateurs', nl: '6. Door gebruikers gegenereerde inhoud' })}
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            {t({
              sv: 'Konstverk som laddas upp av konstnärer till Art Market tillhör konstnären. Artboris agerar som marknadsplats och tar en provision vid försäljning. Konstnären ger Artboris rätt att visa verket i marknadsföringssyfte.',
              en: 'Artworks uploaded by artists to Art Market belong to the artist. Artboris acts as a marketplace and takes a commission on sales. The artist grants Artboris the right to display the work for marketing purposes.',
              de: 'Kunstwerke, die von Künstlern auf den Art Market hochgeladen werden, gehören dem Künstler. Artboris fungiert als Marktplatz und erhebt eine Provision beim Verkauf. Der Künstler gewährt Artboris das Recht, das Werk zu Marketingzwecken anzuzeigen.',
              fr: 'Les œuvres téléchargées par les artistes sur Art Market appartiennent à l\'artiste. Artboris agit en tant que place de marché et prélève une commission sur les ventes. L\'artiste accorde à Artboris le droit d\'afficher l\'œuvre à des fins marketing.',
              nl: 'Kunstwerken die door kunstenaars naar Art Market worden geüpload, zijn eigendom van de kunstenaar. Artboris fungeert als marktplaats en neemt een commissie bij verkoop. De kunstenaar geeft Artboris het recht om het werk voor marketingdoeleinden te tonen.',
            })}
          </p>
        </section>

        {/* Section 7: Privacy */}
        <section className="mb-10">
          <h2 className="text-lg font-medium text-gray-900 mb-3">
            {t({ sv: '7. Integritet', en: '7. Privacy', de: '7. Datenschutz', fr: '7. Confidentialité', nl: '7. Privacy' })}
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            {t({
              sv: 'Vi behandlar personuppgifter i enlighet med GDPR. Rumsfoton som laddas upp för "prova på vägg"-funktionen lagras tillfälligt och raderas automatiskt. Se vår integritetspolicy för fullständig information.',
              en: 'We process personal data in accordance with GDPR. Room photos uploaded for the "try on wall" feature are stored temporarily and automatically deleted. See our privacy policy for full details.',
              de: 'Wir verarbeiten personenbezogene Daten gemäß der DSGVO. Raumfotos, die für die „An der Wand testen“-Funktion hochgeladen werden, werden vorübergehend gespeichert und automatisch gelöscht. Weitere Informationen findest du in unserer Datenschutzerklärung.',
              fr: 'Nous traitons les données personnelles conformément au RGPD. Les photos de pièces téléchargées pour la fonction « essayer sur le mur » sont stockées temporairement et supprimées automatiquement. Consultez notre politique de confidentialité pour plus de détails.',
              nl: 'Wij verwerken persoonsgegevens in overeenstemming met de AVG. Kamerfoto\'s die worden geüpload voor de "probeer op je muur"-functie worden tijdelijk opgeslagen en automatisch verwijderd. Zie ons privacybeleid voor volledige informatie.',
            })}
          </p>
        </section>

        {/* Section 8: Limitation */}
        <section className="mb-10">
          <h2 className="text-lg font-medium text-gray-900 mb-3">
            {t({ sv: '8. Ansvarsbegränsning', en: '8. Limitation of Liability', de: '8. Haftungsbeschränkung', fr: '8. Limitation de responsabilité', nl: '8. Beperking van aansprakelijkheid' })}
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            {t({
              sv: 'Artboris ansvarar inte för färgavvikelser mellan skärm och tryck. AI-genererade motiv kan variera och vi garanterar inte specifika resultat. Vår maximala ersättningsskyldighet begränsas till det belopp kunden betalat.',
              en: 'Artboris is not liable for color differences between screen and print. AI-generated designs may vary and we do not guarantee specific results. Our maximum liability is limited to the amount paid by the customer.',
              de: 'Artboris haftet nicht für Farbabweichungen zwischen Bildschirm und Druck. KI-generierte Motive können variieren und wir garantieren keine bestimmten Ergebnisse. Unsere maximale Haftung beschränkt sich auf den vom Kunden gezahlten Betrag.',
              fr: 'Artboris n\'est pas responsable des différences de couleur entre l\'écran et l\'impression. Les motifs générés par IA peuvent varier et nous ne garantissons pas de résultats spécifiques. Notre responsabilité maximale est limitée au montant payé par le client.',
              nl: 'Artboris is niet aansprakelijk voor kleurverschillen tussen scherm en print. AI-gegenereerde motieven kunnen variëren en wij garanderen geen specifieke resultaten. Onze maximale aansprakelijkheid is beperkt tot het door de klant betaalde bedrag.',
            })}
          </p>
        </section>

        {/* Section 9: Contact */}
        <section className="mb-10">
          <h2 className="text-lg font-medium text-gray-900 mb-3">
            {t({ sv: '9. Kontakt', en: '9. Contact', de: '9. Kontakt', fr: '9. Contact', nl: '9. Contact' })}
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            {t({
              sv: 'Artboris AB — kontakta oss via hello@artboris.com för frågor om dessa villkor.',
              en: 'Artboris AB — contact us at hello@artboris.com for questions about these terms.',
              de: 'Artboris AB — kontaktiere uns unter hello@artboris.com bei Fragen zu diesen Bedingungen.',
              fr: 'Artboris AB \u2014 contactez-nous \u00e0 hello@artboris.com pour toute question concernant ces conditions.',
              nl: 'Artboris AB \u2014 neem contact met ons op via hello@artboris.com voor vragen over deze voorwaarden.',
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
