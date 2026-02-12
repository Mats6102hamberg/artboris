const BLOCKED_TERMS = [
  'nude', 'naked', 'nsfw', 'porn', 'sex',
  'violence', 'gore', 'blood', 'murder', 'kill',
  'drug', 'cocaine', 'heroin', 'meth',
  'hate', 'racist', 'nazi', 'swastika',
  'child abuse', 'terrorism', 'bomb',
  'weapon', 'gun', 'rifle',
  'suicide', 'self-harm',
  // Swedish equivalents
  'naken', 'porr', 'våld', 'mord', 'döda',
  'drog', 'kokain', 'hat', 'rasist',
  'vapen', 'gevär', 'pistol',
  'självmord', 'självskada',
]

const BLOCKED_PATTERNS = [
  /\b(deep\s*fake)/i,
  /\b(real\s*person)/i,
  /\b(celebrity|kändi[s])/i,
  /\b(copyright|varumärke)/i,
]

export interface SafetyCheckResult {
  safe: boolean
  reason?: string
  blockedTerm?: string
}

export function checkPromptSafety(prompt: string): SafetyCheckResult {
  const lower = prompt.toLowerCase()

  for (const term of BLOCKED_TERMS) {
    if (lower.includes(term)) {
      return {
        safe: false,
        reason: `Prompten innehåller otillåtet innehåll.`,
        blockedTerm: term,
      }
    }
  }

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(prompt)) {
      return {
        safe: false,
        reason: `Prompten innehåller otillåtet mönster.`,
        blockedTerm: pattern.source,
      }
    }
  }

  if (prompt.length > 2000) {
    return {
      safe: false,
      reason: 'Prompten är för lång (max 2000 tecken).',
    }
  }

  if (prompt.trim().length < 3) {
    return {
      safe: false,
      reason: 'Prompten är för kort.',
    }
  }

  return { safe: true }
}

export function sanitizePrompt(prompt: string): string {
  let sanitized = prompt.trim()

  for (const term of BLOCKED_TERMS) {
    const regex = new RegExp(term, 'gi')
    sanitized = sanitized.replace(regex, '[removed]')
  }

  if (sanitized.length > 2000) {
    sanitized = sanitized.slice(0, 2000)
  }

  return sanitized
}
