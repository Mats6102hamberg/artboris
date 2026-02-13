/**
 * Boris Curator Voice — dynamic feedback for the design editor.
 * Returns curated comments based on frame, size, position, and style.
 */

// --- Frame feedback ---
const FRAME_COMMENTS: Record<string, string[]> = {
  none: [
    'Utan ram låter du motivet tala helt för sig själv. Modigt och rent.',
    'Ramlöst — som ett fönster rakt in i konsten. Jag gillar det.',
    'Ingen ram? Det ger ett galleri-känsla. Motivet andas fritt.',
  ],
  black: [
    'Svart ram — distinkt och modernt. Den ramar in motivet med auktoritet.',
    'En svart ram ger djup och kontrast. Klassiskt val som aldrig sviker.',
    'Svart mot väggen skapar en tydlig gräns. Motivet poppar.',
    'Den svarta ramen adderar en grafisk skärpa. Starkt val.',
  ],
  white: [
    'Vit ram — skandinavisk minimalism i sin renaste form. Elegant.',
    'Vitt mot motivet skapar luft och ljus. Rummet känns genast öppnare.',
    'En vit ram är som en andningspaus. Den låter konsten sjunka in.',
    'Vit ram och det här motivet? Skandinavisk perfektion.',
  ],
  oak: [
    'Ekram — organiskt och varmt. Den binder samman konst och natur.',
    'Ek ger rummet en jordnära känsla. Motivet landar mjukt.',
    'Vilket öga du har! Ekramen skapar ett sömlöst samarbete med motivet.',
    'Ek och konst — som skog och himmel. Naturligt vackert.',
  ],
  walnut: [
    'Valnöt — sofistikerat och djupt. En ram för den som vet vad de vill.',
    'Valnötsramen ger en rik, mörk värme. Lyxigt utan att skrika.',
    'Valnöt mot det här motivet? Du har en kurators instinkt.',
    'Den mörka valnöten skapar dramatik. Rummet får karaktär.',
  ],
  gold: [
    'Guld — för den som vågar. Det här blir rummets kronjuvel.',
    'En guldram säger: "Det här är konst, och jag vet om det." Bravo.',
    'Guld adderar en tidlös elegans. Motivet förvandlas till ett mästerverk.',
    'Guldram? Nu pratar vi galleri-nivå. Imponerande val.',
  ],
}

// --- Placement feedback ---
const PLACEMENT_COMMENTS: string[] = [
  'Jag har placerat bilden i ögonhöjd — det är där konst gör störst intryck. Flytta runt den som du vill!',
  'Bilden sitter nu där blicken naturligt landar. Perfekt utgångspunkt — justera fritt!',
  'Jag la den centrerat på väggen. Dra runt den tills det känns rätt — du bestämmer!',
  'Startposition: ögonhöjd, lätt åt vänster. Det brukar ge bäst balans. Flytta som du vill!',
]

// --- Size feedback ---
const SIZE_COMMENTS: Record<string, string[]> = {
  small: [
    'En mindre storlek — perfekt för en intim hörna eller en gallerivägg med flera verk.',
    'Litet format, stor effekt. Det här blir en juvel på rätt plats.',
  ],
  medium: [
    'Mellanstor — den mest mångsidiga storleken. Passar nästan överallt.',
    'Det här formatet ger motivet utrymme utan att dominera. Smart val.',
  ],
  large: [
    'Stort format! Det här blir ett statement. Väggen kommer att tacka dig.',
    'En stor tavla kräver mod. Du har det. Det här blir magnifikt.',
    'I den här storleken blir motivet rummets hjärta. Imponerande.',
  ],
}

// --- Style/mood feedback ---
const STYLE_COMMENTS: Record<string, string[]> = {
  minimal: [
    'Minimalistiskt motiv — varje linje räknas. Less is more.',
    'Ren estetik. Det här motivet vilar i sin enkelhet.',
  ],
  abstract: [
    'Abstrakt konst väcker känslor utan att förklara. Spännande val.',
    'Det abstrakta motivet ger rummet rörelse och energi.',
  ],
  nature: [
    'Natur på väggen — det ger rummet liv och lugn.',
    'Naturmotivet skapar en koppling till det vilda. Vackert.',
  ],
  portrait: [
    'Ett porträtt ger rummet själ. Ögonen följer dig — på bästa sätt.',
    'Porträtt på väggen skapar närvaro. Starkt val.',
  ],
  default: [
    'Intressant motiv! Det här har potential att bli rummets mittpunkt.',
    'Jag ser vad du gör här. Motivet har karaktär.',
  ],
}

// --- Move feedback (when user repositions) ---
const MOVE_COMMENTS: string[] = [
  'Bra känsla! Den positionen ger fin balans.',
  'Där! Det skapar ett naturligt fokus i rummet.',
  'Intressant placering — det bryter mönstret på ett bra sätt.',
  'Du har ett öga för komposition. Den landar fint där.',
  'Lite högre, lite lägre — du hittar rätt. Lita på din instinkt.',
]

// --- Image enhancement feedback (upload phase) ---
const ENHANCEMENT_COMMENTS: string[] = [
  'Ge mig en sekund – jag gör bilden redo för tryck så att den blir skarp och balanserad på väggen.',
  'Klart. Nu är den anpassad för ditt format och kommer se lika bra ut i verkligheten som här.',
  'Jag har förberett bilden för produktion så att detaljer och kontrast kommer fram fint i trycket.',
  'Nu är allt optimerat för din valda storlek – det här kommer bli riktigt snyggt.',
  'Perfekt. Din tavla är nu i rätt kvalitet för att tryckas och ramas in.',
  'Så där – nu är bilden redo att bli en färdig tavla.',
]

// --- Scale feedback ---
const SCALE_COMMENTS = {
  up: [
    'Större! Ja, ge motivet det utrymme det förtjänar.',
    'Bra — i den storleken gör konsten verkligen intryck.',
  ],
  down: [
    'Lite mindre — det ger mer luft runt motivet. Elegant.',
    'Nedskala kan vara lika kraftfullt. Ibland är mindre mer.',
  ],
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function getSizeCategory(sizeId: string): 'small' | 'medium' | 'large' {
  if (['a5', 'a4', '30x40'].includes(sizeId)) return 'small'
  if (['a3', '40x50', '50x70'].includes(sizeId)) return 'medium'
  return 'large'
}

export type BorisEvent =
  | { type: 'placement' }
  | { type: 'enhancement' }
  | { type: 'frame_change'; frameId: string }
  | { type: 'size_change'; sizeId: string }
  | { type: 'move' }
  | { type: 'scale'; direction: 'up' | 'down' }
  | { type: 'style_match'; frameId: string; style: string }

export function getBorisComment(event: BorisEvent): string {
  switch (event.type) {
    case 'placement':
      return pick(PLACEMENT_COMMENTS)

    case 'enhancement':
      return pick(ENHANCEMENT_COMMENTS)

    case 'frame_change': {
      const comments = FRAME_COMMENTS[event.frameId] || FRAME_COMMENTS['none']
      return pick(comments)
    }

    case 'size_change': {
      const cat = getSizeCategory(event.sizeId)
      return pick(SIZE_COMMENTS[cat])
    }

    case 'move':
      return pick(MOVE_COMMENTS)

    case 'scale':
      return pick(SCALE_COMMENTS[event.direction])

    case 'style_match': {
      const styleComments = STYLE_COMMENTS[event.style] || STYLE_COMMENTS['default']
      const frameComments = FRAME_COMMENTS[event.frameId] || FRAME_COMMENTS['none']
      // 50% chance of style comment, 50% frame comment
      return Math.random() > 0.5 ? pick(styleComments) : pick(frameComments)
    }

    default:
      return pick(STYLE_COMMENTS['default'])
  }
}
