import { StylePreset, MoodType, DesignControls } from '@/types/design'
import { STYLE_DEFINITIONS, MOOD_PROMPT_MODIFIERS } from './styles'

export interface GeneratePromptResult {
  prompt: string
  negativePrompt?: string
}

export function buildGeneratePrompt(
  style: StylePreset,
  controls: DesignControls,
  userDescription?: string
): GeneratePromptResult {
  const styleDef = STYLE_DEFINITIONS[style]
  const moodMod = MOOD_PROMPT_MODIFIERS[controls.mood]

  const colorDesc = controls.colorPalette.length > 0
    ? `Color palette: ${controls.colorPalette.join(', ')}.`
    : ''

  const textDesc = controls.textOverlay && controls.textPosition !== 'none'
    ? `Include the text "${controls.textOverlay}" positioned at the ${controls.textPosition} of the composition.`
    : ''

  const contrastDesc = controls.contrast !== 50
    ? controls.contrast > 50
      ? 'High contrast.'
      : 'Low contrast, soft tones.'
    : ''

  const brightnessDesc = controls.brightness !== 50
    ? controls.brightness > 50
      ? 'Bright, well-lit.'
      : 'Dark, moody lighting.'
    : ''

  const userPart = userDescription
    ? `User request: ${userDescription}.`
    : ''

  const prompt = [
    `Create a high-quality poster design.`,
    styleDef.promptPrefix,
    moodMod,
    colorDesc,
    contrastDesc,
    brightnessDesc,
    textDesc,
    userPart,
    `The image should be suitable for printing as a wall poster.`,
    `Aspect ratio: 2:3 portrait orientation.`,
    `High resolution, professional quality.`,
  ]
    .filter(Boolean)
    .join(' ')

  return {
    prompt,
    negativePrompt: styleDef.negativePrompt,
  }
}

export function buildRefinePrompt(
  originalPrompt: string,
  feedback: string,
  controls: DesignControls,
  style?: StylePreset
): string {
  const moodMod = MOOD_PROMPT_MODIFIERS[controls.mood]

  // Pick a random variation hint for Boris styles
  let variationPart = ''
  if (style) {
    const styleDef = STYLE_DEFINITIONS[style]
    if (styleDef.variationHints && styleDef.variationHints.length > 0) {
      const hint = styleDef.variationHints[Math.floor(Math.random() * styleDef.variationHints.length)]
      variationPart = `Artistic variation: ${hint}.`
    }
  }

  return [
    `Refine the following poster design based on user feedback.`,
    `Original concept: ${originalPrompt}`,
    `User feedback: ${feedback}`,
    `Updated mood: ${moodMod}`,
    controls.textOverlay && controls.textPosition !== 'none'
      ? `Include text "${controls.textOverlay}" at ${controls.textPosition}.`
      : '',
    variationPart,
    `Maintain the overall style but incorporate the requested changes.`,
    `High resolution, print-ready quality, 2:3 portrait.`,
  ]
    .filter(Boolean)
    .join(' ')
}

export function buildFinalRenderPrompt(
  originalPrompt: string,
  controls: DesignControls,
  widthPx: number,
  heightPx: number,
  style?: StylePreset
): string {
  // Add print modifier for Boris styles
  let printPart = ''
  if (style) {
    const styleDef = STYLE_DEFINITIONS[style]
    if (styleDef.printModifier) {
      printPart = styleDef.printModifier
    }
  }

  return [
    `Final high-resolution render for print production.`,
    originalPrompt,
    printPart,
    `Output resolution: ${widthPx}x${heightPx} pixels.`,
    `Ensure crisp details, no artifacts, print-ready quality.`,
    `No watermarks, no borders, clean edges.`,
  ]
    .filter(Boolean)
    .join(' ')
}
