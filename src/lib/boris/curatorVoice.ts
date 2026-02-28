/**
 * Boris Curator Voice — dynamic feedback for the design editor.
 * Returns curated comments based on frame, size, position, and style.
 * Supports sv, en, de locales.
 */

import { type Locale } from '@/lib/i18n'

type L = Record<string, string[]>

// --- Frame feedback ---
const FRAME_COMMENTS: Record<string, L> = {
  none: {
    sv: [
      'Utan ram låter du motivet tala helt för sig själv. Modigt och rent.',
      'Ramlöst — som ett fönster rakt in i konsten. Jag gillar det.',
      'Ingen ram? Det ger ett galleri-känsla. Motivet andas fritt.',
    ],
    en: [
      'Without a frame, you let the artwork speak entirely for itself. Bold and clean.',
      'Frameless — like a window straight into the art. I like it.',
      'No frame? That gives a gallery feel. The artwork breathes freely.',
    ],
    de: [
      'Ohne Rahmen lässt du das Motiv ganz für sich sprechen. Mutig und rein.',
      'Rahmenlos — wie ein Fenster direkt in die Kunst. Gefällt mir.',
      'Kein Rahmen? Das gibt ein Galerie-Gefühl. Das Motiv atmet frei.',
    ],
  },
  black: {
    sv: [
      'Svart ram — distinkt och modernt. Den ramar in motivet med auktoritet.',
      'En svart ram ger djup och kontrast. Klassiskt val som aldrig sviker.',
      'Svart mot väggen skapar en tydlig gräns. Motivet poppar.',
      'Den svarta ramen adderar en grafisk skärpa. Starkt val.',
    ],
    en: [
      'Black frame — distinct and modern. It frames the artwork with authority.',
      'A black frame gives depth and contrast. A classic choice that never disappoints.',
      'Black against the wall creates a clear boundary. The artwork pops.',
      'The black frame adds a graphic sharpness. Strong choice.',
    ],
    de: [
      'Schwarzer Rahmen — markant und modern. Er rahmt das Motiv mit Autorität ein.',
      'Ein schwarzer Rahmen gibt Tiefe und Kontrast. Eine klassische Wahl, die nie enttäuscht.',
      'Schwarz an der Wand schafft eine klare Grenze. Das Motiv kommt zur Geltung.',
      'Der schwarze Rahmen fügt grafische Schärfe hinzu. Starke Wahl.',
    ],
  },
  white: {
    sv: [
      'Vit ram — skandinavisk minimalism i sin renaste form. Elegant.',
      'Vitt mot motivet skapar luft och ljus. Rummet känns genast öppnare.',
      'En vit ram är som en andningspaus. Den låter konsten sjunka in.',
      'Vit ram och det här motivet? Skandinavisk perfektion.',
    ],
    en: [
      'White frame — Scandinavian minimalism in its purest form. Elegant.',
      'White against the artwork creates air and light. The room instantly feels more open.',
      'A white frame is like a breathing pause. It lets the art sink in.',
      'White frame with this artwork? Scandinavian perfection.',
    ],
    de: [
      'Weißer Rahmen — skandinavischer Minimalismus in seiner reinsten Form. Elegant.',
      'Weiß gegen das Motiv schafft Luft und Licht. Der Raum fühlt sich sofort offener an.',
      'Ein weißer Rahmen ist wie eine Atempause. Er lässt die Kunst wirken.',
      'Weißer Rahmen mit diesem Motiv? Skandinavische Perfektion.',
    ],
  },
  oak: {
    sv: [
      'Ekram — organiskt och varmt. Den binder samman konst och natur.',
      'Ek ger rummet en jordnära känsla. Motivet landar mjukt.',
      'Vilket öga du har! Ekramen skapar ett sömlöst samarbete med motivet.',
      'Ek och konst — som skog och himmel. Naturligt vackert.',
    ],
    en: [
      'Oak frame — organic and warm. It connects art and nature.',
      'Oak gives the room an earthy feel. The artwork lands softly.',
      'What an eye you have! The oak frame creates a seamless collaboration with the artwork.',
      'Oak and art — like forest and sky. Naturally beautiful.',
    ],
    de: [
      'Eichenrahmen — organisch und warm. Er verbindet Kunst und Natur.',
      'Eiche gibt dem Raum ein erdiges Gefühl. Das Motiv landet sanft.',
      'Was für ein Auge du hast! Der Eichenrahmen schafft eine nahtlose Zusammenarbeit mit dem Motiv.',
      'Eiche und Kunst — wie Wald und Himmel. Natürlich schön.',
    ],
  },
  walnut: {
    sv: [
      'Valnöt — sofistikerat och djupt. En ram för den som vet vad de vill.',
      'Valnötsramen ger en rik, mörk värme. Lyxigt utan att skrika.',
      'Valnöt mot det här motivet? Du har en kurators instinkt.',
      'Den mörka valnöten skapar dramatik. Rummet får karaktär.',
    ],
    en: [
      'Walnut — sophisticated and deep. A frame for those who know what they want.',
      'The walnut frame gives a rich, dark warmth. Luxurious without being loud.',
      'Walnut with this artwork? You have a curator\'s instinct.',
      'The dark walnut creates drama. The room gains character.',
    ],
    de: [
      'Walnuss — raffiniert und tiefgründig. Ein Rahmen für die, die wissen, was sie wollen.',
      'Der Walnussrahmen gibt eine reiche, dunkle Wärme. Luxuriös ohne zu schreien.',
      'Walnuss mit diesem Motiv? Du hast den Instinkt eines Kurators.',
      'Das dunkle Walnussholz schafft Dramatik. Der Raum gewinnt Charakter.',
    ],
  },
  gold: {
    sv: [
      'Guld — för den som vågar. Det här blir rummets kronjuvel.',
      'En guldram säger: "Det här är konst, och jag vet om det." Bravo.',
      'Guld adderar en tidlös elegans. Motivet förvandlas till ett mästerverk.',
      'Guldram? Nu pratar vi galleri-nivå. Imponerande val.',
    ],
    en: [
      'Gold — for those who dare. This will be the room\'s crown jewel.',
      'A gold frame says: "This is art, and I know it." Bravo.',
      'Gold adds a timeless elegance. The artwork transforms into a masterpiece.',
      'Gold frame? Now we\'re talking gallery level. Impressive choice.',
    ],
    de: [
      'Gold — für die, die sich trauen. Das wird das Kronjuwel des Raums.',
      'Ein Goldrahmen sagt: „Das ist Kunst, und ich weiß es." Bravo.',
      'Gold fügt eine zeitlose Eleganz hinzu. Das Motiv wird zum Meisterwerk.',
      'Goldrahmen? Jetzt reden wir von Galerie-Niveau. Beeindruckende Wahl.',
    ],
  },
}

// --- Placement feedback ---
const PLACEMENT_COMMENTS: L = {
  sv: [
    'Jag har placerat bilden i ögonhöjd — det är där konst gör störst intryck. Flytta runt den som du vill!',
    'Bilden sitter nu där blicken naturligt landar. Perfekt utgångspunkt — justera fritt!',
    'Jag la den centrerat på väggen. Dra runt den tills det känns rätt — du bestämmer!',
    'Startposition: ögonhöjd, lätt åt vänster. Det brukar ge bäst balans. Flytta som du vill!',
  ],
  en: [
    'I\'ve placed the image at eye level — that\'s where art makes the biggest impression. Move it around as you like!',
    'The image now sits where the eye naturally lands. Perfect starting point — adjust freely!',
    'I placed it centred on the wall. Drag it around until it feels right — you decide!',
    'Starting position: eye level, slightly to the left. That usually gives the best balance. Move as you wish!',
  ],
  de: [
    'Ich habe das Bild auf Augenhöhe platziert — dort macht Kunst den größten Eindruck. Verschiebe es nach Belieben!',
    'Das Bild sitzt jetzt dort, wo der Blick natürlich landet. Perfekter Ausgangspunkt — passe frei an!',
    'Ich habe es zentriert an der Wand platziert. Ziehe es herum, bis es sich richtig anfühlt — du entscheidest!',
    'Startposition: Augenhöhe, leicht nach links. Das gibt meist die beste Balance. Verschiebe nach Wunsch!',
  ],
}

// --- Size feedback ---
const SIZE_COMMENTS: Record<string, L> = {
  small: {
    sv: [
      'En mindre storlek — perfekt för en intim hörna eller en gallerivägg med flera verk.',
      'Litet format, stor effekt. Det här blir en juvel på rätt plats.',
    ],
    en: [
      'A smaller size — perfect for a cosy corner or a gallery wall with multiple works.',
      'Small format, big impact. This will be a gem in the right spot.',
    ],
    de: [
      'Eine kleinere Größe — perfekt für eine gemütliche Ecke oder eine Galeriewand mit mehreren Werken.',
      'Kleines Format, große Wirkung. Das wird ein Juwel am richtigen Platz.',
    ],
  },
  medium: {
    sv: [
      'Mellanstor — den mest mångsidiga storleken. Passar nästan överallt.',
      'Det här formatet ger motivet utrymme utan att dominera. Smart val.',
    ],
    en: [
      'Medium — the most versatile size. Fits almost anywhere.',
      'This format gives the artwork space without dominating. Smart choice.',
    ],
    de: [
      'Mittelgroß — die vielseitigste Größe. Passt fast überall.',
      'Dieses Format gibt dem Motiv Raum, ohne zu dominieren. Kluge Wahl.',
    ],
  },
  large: {
    sv: [
      'Stort format! Det här blir ett statement. Väggen kommer att tacka dig.',
      'En stor tavla kräver mod. Du har det. Det här blir magnifikt.',
      'I den här storleken blir motivet rummets hjärta. Imponerande.',
    ],
    en: [
      'Large format! This will be a statement. The wall will thank you.',
      'A large artwork takes courage. You have it. This will be magnificent.',
      'At this size, the artwork becomes the heart of the room. Impressive.',
    ],
    de: [
      'Großes Format! Das wird ein Statement. Die Wand wird es dir danken.',
      'Ein großes Kunstwerk erfordert Mut. Du hast ihn. Das wird großartig.',
      'In dieser Größe wird das Motiv zum Herzen des Raums. Beeindruckend.',
    ],
  },
}

const DEFAULT_LINE: L = {
  sv: ['Den här storleken ger konsten rätt förutsättningar.'],
  en: ['This size gives the art the right conditions.'],
  de: ['Diese Größe gibt der Kunst die richtigen Voraussetzungen.'],
}

// --- Style/mood feedback ---
const STYLE_COMMENTS: Record<string, L> = {
  minimal: {
    sv: [
      'Minimalistiskt motiv — varje linje räknas. Less is more.',
      'Ren estetik. Det här motivet vilar i sin enkelhet.',
    ],
    en: [
      'Minimalist artwork — every line counts. Less is more.',
      'Pure aesthetics. This artwork rests in its simplicity.',
    ],
    de: [
      'Minimalistisches Motiv — jede Linie zählt. Weniger ist mehr.',
      'Reine Ästhetik. Dieses Motiv ruht in seiner Einfachheit.',
    ],
  },
  abstract: {
    sv: [
      'Abstrakt konst väcker känslor utan att förklara. Spännande val.',
      'Det abstrakta motivet ger rummet rörelse och energi.',
    ],
    en: [
      'Abstract art evokes feelings without explaining. Exciting choice.',
      'The abstract artwork gives the room movement and energy.',
    ],
    de: [
      'Abstrakte Kunst weckt Gefühle, ohne zu erklären. Spannende Wahl.',
      'Das abstrakte Motiv gibt dem Raum Bewegung und Energie.',
    ],
  },
  nature: {
    sv: [
      'Natur på väggen — det ger rummet liv och lugn.',
      'Naturmotivet skapar en koppling till det vilda. Vackert.',
    ],
    en: [
      'Nature on the wall — it gives the room life and calm.',
      'The nature motif creates a connection to the wild. Beautiful.',
    ],
    de: [
      'Natur an der Wand — das gibt dem Raum Leben und Ruhe.',
      'Das Naturmotiv schafft eine Verbindung zur Wildnis. Wunderschön.',
    ],
  },
  portrait: {
    sv: [
      'Ett porträtt ger rummet själ. Ögonen följer dig — på bästa sätt.',
      'Porträtt på väggen skapar närvaro. Starkt val.',
    ],
    en: [
      'A portrait gives the room soul. The eyes follow you — in the best way.',
      'A portrait on the wall creates presence. Strong choice.',
    ],
    de: [
      'Ein Porträt gibt dem Raum Seele. Die Augen folgen dir — auf die beste Art.',
      'Ein Porträt an der Wand schafft Präsenz. Starke Wahl.',
    ],
  },
  default: {
    sv: [
      'Intressant motiv! Det här har potential att bli rummets mittpunkt.',
      'Jag ser vad du gör här. Motivet har karaktär.',
    ],
    en: [
      'Interesting artwork! This has the potential to become the room\'s focal point.',
      'I see what you\'re doing here. The artwork has character.',
    ],
    de: [
      'Interessantes Motiv! Das hat das Potenzial, zum Mittelpunkt des Raums zu werden.',
      'Ich sehe, was du hier machst. Das Motiv hat Charakter.',
    ],
  },
}

// --- Move feedback (when user repositions) ---
const MOVE_COMMENTS: L = {
  sv: [
    'Bra känsla! Den positionen ger fin balans.',
    'Där! Det skapar ett naturligt fokus i rummet.',
    'Intressant placering — det bryter mönstret på ett bra sätt.',
    'Du har ett öga för komposition. Den landar fint där.',
    'Lite högre, lite lägre — du hittar rätt. Lita på din instinkt.',
  ],
  en: [
    'Good feeling! That position gives a nice balance.',
    'There! That creates a natural focal point in the room.',
    'Interesting placement — it breaks the pattern in a good way.',
    'You have an eye for composition. It lands nicely there.',
    'A little higher, a little lower — you\'ll find the right spot. Trust your instinct.',
  ],
  de: [
    'Gutes Gefühl! Diese Position gibt eine schöne Balance.',
    'Da! Das schafft einen natürlichen Fokuspunkt im Raum.',
    'Interessante Platzierung — das bricht das Muster auf gute Weise.',
    'Du hast ein Auge für Komposition. Es landet schön dort.',
    'Ein bisschen höher, ein bisschen tiefer — du findest die richtige Stelle. Vertrau deinem Instinkt.',
  ],
}

// --- Image enhancement feedback (upload phase) ---
const ENHANCEMENT_COMMENTS: L = {
  sv: [
    'Ge mig en sekund – jag gör bilden redo för tryck så att den blir skarp och balanserad på väggen.',
    'Klart. Nu är den anpassad för ditt format och kommer se lika bra ut i verkligheten som här.',
    'Jag har förberett bilden för produktion så att detaljer och kontrast kommer fram fint i trycket.',
    'Nu är allt optimerat för din valda storlek – det här kommer bli riktigt snyggt.',
    'Perfekt. Din tavla är nu i rätt kvalitet för att tryckas och ramas in.',
    'Så där – nu är bilden redo att bli en färdig tavla.',
  ],
  en: [
    'Give me a second — I\'m getting the image ready for print so it\'ll be sharp and balanced on the wall.',
    'Done. It\'s now adapted for your format and will look just as good in reality as it does here.',
    'I\'ve prepared the image for production so details and contrast come through nicely in the print.',
    'Everything is now optimised for your chosen size — this is going to look really great.',
    'Perfect. Your artwork is now at the right quality for printing and framing.',
    'There we go — the image is now ready to become a finished artwork.',
  ],
  de: [
    'Gib mir eine Sekunde — ich mache das Bild druckfertig, damit es scharf und ausgewogen an der Wand aussieht.',
    'Fertig. Es ist jetzt an dein Format angepasst und wird in Wirklichkeit genauso gut aussehen wie hier.',
    'Ich habe das Bild für die Produktion vorbereitet, damit Details und Kontrast im Druck schön rauskommen.',
    'Alles ist jetzt für deine gewählte Größe optimiert — das wird richtig gut aussehen.',
    'Perfekt. Dein Kunstwerk hat jetzt die richtige Qualität zum Drucken und Einrahmen.',
    'So — das Bild ist jetzt bereit, ein fertiges Kunstwerk zu werden.',
  ],
}

// --- Wall change feedback ---
const WALL_CHANGE_COMMENTS: Record<string, L> = {
  vardagsrum: {
    sv: [
      'Vardagsrummet — klassiskt val. Här får tavlan mest uppmärksamhet.',
      'Bra rum! Ovanför soffan brukar vara den perfekta platsen.',
    ],
    en: [
      'The living room — a classic choice. This is where the artwork gets the most attention.',
      'Great room! Above the sofa is usually the perfect spot.',
    ],
    de: [
      'Das Wohnzimmer — eine klassische Wahl. Hier bekommt das Kunstwerk die meiste Aufmerksamkeit.',
      'Tolles Zimmer! Über dem Sofa ist normalerweise der perfekte Platz.',
    ],
  },
  sovrum: {
    sv: [
      'Sovrummet — konsten du ser först på morgonen och sist på kvällen. Viktigt val.',
      'Ett sovrum med rätt konst skapar lugn. Bra instinkt.',
    ],
    en: [
      'The bedroom — the art you see first in the morning and last at night. Important choice.',
      'A bedroom with the right art creates calm. Good instinct.',
    ],
    de: [
      'Das Schlafzimmer — das Kunstwerk, das du morgens zuerst und abends zuletzt siehst. Wichtige Wahl.',
      'Ein Schlafzimmer mit der richtigen Kunst schafft Ruhe. Guter Instinkt.',
    ],
  },
  kok: {
    sv: [
      'Köket! Konst här ger rummet personlighet. Oväntat men snyggt.',
      'Konst i köket — det visar att du har stil i varje rum.',
    ],
    en: [
      'The kitchen! Art here gives the room personality. Unexpected but great.',
      'Art in the kitchen — it shows you have style in every room.',
    ],
    de: [
      'Die Küche! Kunst hier gibt dem Raum Persönlichkeit. Unerwartet aber toll.',
      'Kunst in der Küche — das zeigt, dass du in jedem Raum Stil hast.',
    ],
  },
  kontor: {
    sv: [
      'Kontoret — den perfekta platsen för konst som inspirerar.',
      'Rätt konst på kontoret kan göra underverk för kreativiteten.',
    ],
    en: [
      'The office — the perfect spot for art that inspires.',
      'The right art in the office can do wonders for creativity.',
    ],
    de: [
      'Das Büro — der perfekte Ort für inspirierende Kunst.',
      'Die richtige Kunst im Büro kann Wunder für die Kreativität bewirken.',
    ],
  },
  hall: {
    sv: [
      'Hallen — det första gästerna ser. Sätt tonen direkt.',
      'Konst i hallen skapar ett starkt första intryck. Smart.',
    ],
    en: [
      'The hallway — the first thing guests see. Set the tone right away.',
      'Art in the hallway creates a strong first impression. Smart.',
    ],
    de: [
      'Der Flur — das Erste, was Gäste sehen. Setz den Ton sofort.',
      'Kunst im Flur schafft einen starken ersten Eindruck. Klug.',
    ],
  },
  barnrum: {
    sv: [
      'Barnrummet! Konst som väcker fantasi — perfekt här.',
      'Rätt konst i barnrummet skapar en magisk värld. Fint val.',
    ],
    en: [
      'The kids\' room! Art that sparks imagination — perfect here.',
      'The right art in the kids\' room creates a magical world. Nice choice.',
    ],
    de: [
      'Das Kinderzimmer! Kunst, die Fantasie weckt — perfekt hier.',
      'Die richtige Kunst im Kinderzimmer schafft eine magische Welt. Schöne Wahl.',
    ],
  },
  matsal: {
    sv: [
      'Matsalen — konst som förhöjer måltiden. Elegant val.',
      'En tavla i matsalen ger middagarna en extra dimension.',
    ],
    en: [
      'The dining room — art that elevates the meal. Elegant choice.',
      'A painting in the dining room gives dinners an extra dimension.',
    ],
    de: [
      'Das Esszimmer — Kunst, die das Essen aufwertet. Elegante Wahl.',
      'Ein Bild im Esszimmer gibt den Mahlzeiten eine extra Dimension.',
    ],
  },
  default: {
    sv: [
      'Nytt rum, ny stämning. Tavlan anpassar sig direkt.',
      'Intressant val — låt oss se hur tavlan tar sig här.',
    ],
    en: [
      'New room, new vibe. The artwork adapts instantly.',
      'Interesting choice — let\'s see how the artwork looks here.',
    ],
    de: [
      'Neuer Raum, neue Stimmung. Das Kunstwerk passt sich sofort an.',
      'Interessante Wahl — sehen wir, wie das Kunstwerk hier wirkt.',
    ],
  },
}

// --- Scale feedback ---
const SCALE_COMMENTS: Record<string, L> = {
  up: {
    sv: [
      'Större! Ja, ge motivet det utrymme det förtjänar.',
      'Bra — i den storleken gör konsten verkligen intryck.',
    ],
    en: [
      'Bigger! Yes, give the artwork the space it deserves.',
      'Good — at that size the art really makes an impression.',
    ],
    de: [
      'Größer! Ja, gib dem Motiv den Raum, den es verdient.',
      'Gut — in dieser Größe macht die Kunst wirklich Eindruck.',
    ],
  },
  down: {
    sv: [
      'Lite mindre — det ger mer luft runt motivet. Elegant.',
      'Nedskala kan vara lika kraftfullt. Ibland är mindre mer.',
    ],
    en: [
      'A little smaller — that gives more air around the artwork. Elegant.',
      'Scaling down can be just as powerful. Sometimes less is more.',
    ],
    de: [
      'Etwas kleiner — das gibt mehr Luft um das Motiv. Elegant.',
      'Verkleinern kann genauso wirkungsvoll sein. Manchmal ist weniger mehr.',
    ],
  },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickL(obj: L, locale: Locale): string {
  const arr = obj[locale] || obj['en'] || obj['sv']
  return pick(arr)
}

function getSizeCategory(sizeId: string): 'small' | 'medium' | 'large' {
  if (!sizeId) return 'medium'
  if (['a5', 'a4', '30x40'].includes(sizeId)) return 'small'
  if (['a3', '40x50', '50x70'].includes(sizeId)) return 'medium'
  return 'large'
}

// ─── Public API ──────────────────────────────────────────────────────────────

export type BorisEvent =
  | { type: 'placement' }
  | { type: 'enhancement' }
  | { type: 'frame_change'; frameId: string }
  | { type: 'size_change'; sizeId: string }
  | { type: 'move' }
  | { type: 'scale'; direction: 'up' | 'down' }
  | { type: 'style_match'; frameId: string; style: string }
  | { type: 'wall_change'; wallId: string }

export function getBorisComment(event: BorisEvent, locale: Locale = 'sv'): string {
  switch (event.type) {
    case 'placement':
      return pickL(PLACEMENT_COMMENTS, locale)

    case 'enhancement':
      return pickL(ENHANCEMENT_COMMENTS, locale)

    case 'frame_change': {
      const comments = FRAME_COMMENTS[event.frameId] || FRAME_COMMENTS['none']
      return pickL(comments, locale)
    }

    case 'size_change': {
      const cat = getSizeCategory(event.sizeId)
      const list = SIZE_COMMENTS[cat] ?? SIZE_COMMENTS.medium
      const arr = list[locale] || list['en'] || list['sv']
      if (!arr || arr.length === 0) return pickL(DEFAULT_LINE, locale)
      return pick(arr)
    }

    case 'move':
      return pickL(MOVE_COMMENTS, locale)

    case 'scale':
      return pickL(SCALE_COMMENTS[event.direction] || SCALE_COMMENTS.up, locale)

    case 'style_match': {
      const styleComments = STYLE_COMMENTS[event.style] || STYLE_COMMENTS['default']
      const frameComments = FRAME_COMMENTS[event.frameId] || FRAME_COMMENTS['none']
      // 50% chance of style comment, 50% frame comment
      return Math.random() > 0.5 ? pickL(styleComments, locale) : pickL(frameComments, locale)
    }

    case 'wall_change': {
      const wallComments = WALL_CHANGE_COMMENTS[event.wallId] || WALL_CHANGE_COMMENTS['default']
      return pickL(wallComments, locale)
    }

    default:
      return pickL(STYLE_COMMENTS['default'], locale)
  }
}
