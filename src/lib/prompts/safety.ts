const BLOCKED_PATTERNS = [
  // English terms (word-boundary matched to avoid false positives)
  /\bnude\b/i, /\bnaked\b/i, /\bnsfw\b/i, /\bporn\b/i, /\bsexual\b/i,
  /\bviolence\b/i, /\bgore\b/i, /\bmurder\b/i,
  /\bdrugs?\b/i, /\bcocaine\b/i, /\bheroin\b/i, /\bmeth\b/i,
  /\bracist\b/i, /\bnazi\b/i, /\bswastika\b/i,
  /\bchild\s*abuse\b/i, /\bterrorism\b/i,
  /\bweapon\b/i, /\bsuicide\b/i, /\bself[- ]harm\b/i,
  // Swedish equivalents
  /\bnaken\b/i, /\bporr\b/i, /\bvåld\b/i, /\bmord\b/i, /\bdöda\b/i,
  /\bdrog(er)?\b/i, /\bkokain\b/i, /\brasist\b/i,
  /\bvapen\b/i, /\bgevär\b/i, /\bpistol\b/i,
  /\bsjälvmord\b/i, /\bsjälvskada\b/i,
  // Patterns
  /\bdeep\s*fake\b/i,
  /\breal\s*person\b/i,
  /\bcelebrity\b/i, /\bkändi[s]?\b/i,
  /\bcopyright\b/i, /\bvarumärke\b/i,
]

export interface SafetyCheckResult {
  safe: boolean
  reason?: string
  blockedTerm?: string
}

export function checkPromptSafety(prompt: string): SafetyCheckResult {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(prompt)) {
      console.warn(`[safety] Blocked pattern: ${pattern.source} matched in prompt: "${prompt.substring(0, 200)}..."`)
      return {
        safe: false,
        reason: `Prompten innehåller otillåtet innehåll.`,
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

  for (const pattern of BLOCKED_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[removed]')
  }

  if (sanitized.length > 2000) {
    sanitized = sanitized.slice(0, 2000)
  }

  return sanitized
}
