import { StyleDefinition, StylePreset, MoodType } from '@/types/design'

export const STYLE_DEFINITIONS: Record<StylePreset, StyleDefinition> = {
  nordic: {
    id: 'nordic',
    label: 'Nordisk',
    description: 'Ljusa toner, naturmaterial, skandinavisk enkelhet',
    previewUrl: '/poster-lab/styles/nordic.jpg',
    promptPrefix: 'Scandinavian Nordic design, light tones, natural materials, clean lines, muted earth colors, hygge atmosphere',
    defaultMood: 'calm',
    defaultColors: ['#F5F0EB', '#D4C5B2', '#8B7355', '#2C3E50', '#ECE5DD'],
  },
  retro: {
    id: 'retro',
    label: 'Retro',
    description: '70-tals vibbar, varma färger, nostalgi',
    previewUrl: '/poster-lab/styles/retro.jpg',
    promptPrefix: 'Retro 1970s style poster, warm orange and brown tones, vintage typography, groovy patterns, nostalgic feel',
    defaultMood: 'playful',
    defaultColors: ['#D4763C', '#C4452C', '#F2C94C', '#6B4226', '#F5E6CC'],
  },
  minimal: {
    id: 'minimal',
    label: 'Minimal',
    description: 'Rent, enkelt, svartvitt eller begränsad palett',
    previewUrl: '/poster-lab/styles/minimal.jpg',
    promptPrefix: 'Minimalist poster design, clean composition, limited color palette, negative space, modern simplicity',
    defaultMood: 'elegant',
    defaultColors: ['#FFFFFF', '#000000', '#E0E0E0', '#333333', '#F5F5F5'],
  },
  abstract: {
    id: 'abstract',
    label: 'Abstrakt',
    description: 'Fria former, expressiva färger, konstnärligt',
    previewUrl: '/poster-lab/styles/abstract.jpg',
    promptPrefix: 'Abstract art poster, expressive brushstrokes, bold colors, artistic composition, contemporary art style',
    defaultMood: 'energetic',
    defaultColors: ['#E63946', '#457B9D', '#F1FAEE', '#A8DADC', '#1D3557'],
  },
  botanical: {
    id: 'botanical',
    label: 'Botanisk',
    description: 'Växter, blommor, naturliga illustrationer',
    previewUrl: '/poster-lab/styles/botanical.jpg',
    promptPrefix: 'Botanical illustration poster, detailed plants and flowers, natural colors, scientific illustration style, elegant composition',
    defaultMood: 'calm',
    defaultColors: ['#2D5016', '#8BC34A', '#F5F0EB', '#4A7C2E', '#E8F5E9'],
  },
  geometric: {
    id: 'geometric',
    label: 'Geometrisk',
    description: 'Geometriska former, mönster, Bauhaus-inspirerat',
    previewUrl: '/poster-lab/styles/geometric.jpg',
    promptPrefix: 'Geometric poster design, Bauhaus inspired, bold shapes, primary colors, structured composition, mathematical patterns',
    defaultMood: 'bold',
    defaultColors: ['#FF0000', '#0000FF', '#FFD700', '#000000', '#FFFFFF'],
  },
  watercolor: {
    id: 'watercolor',
    label: 'Akvarell',
    description: 'Mjuka akvarelltoner, flytande former',
    previewUrl: '/poster-lab/styles/watercolor.jpg',
    promptPrefix: 'Watercolor painting style poster, soft flowing colors, wet-on-wet technique, dreamy atmosphere, artistic brushwork',
    defaultMood: 'dreamy',
    defaultColors: ['#A8D8EA', '#AA96DA', '#FCBAD3', '#FFFFD2', '#B5EAD7'],
  },
  'line-art': {
    id: 'line-art',
    label: 'Line Art',
    description: 'Eleganta linjeteckningar, konturkonst',
    previewUrl: '/poster-lab/styles/line-art.jpg',
    promptPrefix: 'Elegant line art poster, continuous line drawing, minimalist contour art, single line illustration, sophisticated simplicity',
    defaultMood: 'elegant',
    defaultColors: ['#000000', '#FFFFFF', '#C9A96E', '#F5F0EB', '#333333'],
  },
  photography: {
    id: 'photography',
    label: 'Fotografi',
    description: 'Fotografiskt, naturskönt, stämningsfullt',
    previewUrl: '/poster-lab/styles/photography.jpg',
    promptPrefix: 'Fine art photography poster, cinematic composition, dramatic lighting, high quality photographic style, atmospheric mood',
    defaultMood: 'dramatic',
    defaultColors: ['#1A1A2E', '#16213E', '#0F3460', '#E94560', '#F5F5F5'],
  },
  typographic: {
    id: 'typographic',
    label: 'Typografi',
    description: 'Text som konst, citat, bokstäver',
    previewUrl: '/poster-lab/styles/typographic.jpg',
    promptPrefix: 'Typographic poster design, beautiful lettering, text as art, creative typography, impactful words, modern font design',
    defaultMood: 'bold',
    defaultColors: ['#000000', '#FFFFFF', '#FF6B6B', '#4ECDC4', '#2C3E50'],
  },
  'pop-art': {
    id: 'pop-art',
    label: 'Pop Art',
    description: 'Warhol-inspirerat, starka färger, grafiskt',
    previewUrl: '/poster-lab/styles/pop-art.jpg',
    promptPrefix: 'Pop art style poster, Andy Warhol inspired, bold primary colors, halftone dots, comic book aesthetic, high contrast',
    defaultMood: 'energetic',
    defaultColors: ['#FF1493', '#00BFFF', '#FFD700', '#FF4500', '#FFFFFF'],
  },
  japanese: {
    id: 'japanese',
    label: 'Japansk',
    description: 'Ukiyo-e, zen, japansk estetik',
    previewUrl: '/poster-lab/styles/japanese.jpg',
    promptPrefix: 'Japanese art style poster, ukiyo-e inspired, zen aesthetic, cherry blossoms, waves, traditional Japanese composition, wabi-sabi',
    defaultMood: 'calm',
    defaultColors: ['#BC002D', '#F5F0EB', '#2C2C2C', '#D4A574', '#5B7065'],
  },
}

export const MOOD_LABELS: Record<MoodType, string> = {
  calm: 'Lugn',
  energetic: 'Energisk',
  dramatic: 'Dramatisk',
  playful: 'Lekfull',
  elegant: 'Elegant',
  cozy: 'Mysig',
  bold: 'Djärv',
  dreamy: 'Drömmande',
}

export const MOOD_PROMPT_MODIFIERS: Record<MoodType, string> = {
  calm: 'serene, peaceful, tranquil atmosphere, soft lighting',
  energetic: 'vibrant, dynamic, high energy, bold movement',
  dramatic: 'dramatic lighting, high contrast, intense mood, cinematic',
  playful: 'fun, whimsical, lighthearted, cheerful colors',
  elegant: 'sophisticated, refined, luxurious, tasteful',
  cozy: 'warm, inviting, comfortable, intimate atmosphere',
  bold: 'striking, powerful, impactful, commanding presence',
  dreamy: 'ethereal, soft focus, fantasy-like, gentle haze',
}

export function getStyleDefinition(style: StylePreset): StyleDefinition {
  return STYLE_DEFINITIONS[style]
}

export function getAllStyles(): StyleDefinition[] {
  return Object.values(STYLE_DEFINITIONS)
}
