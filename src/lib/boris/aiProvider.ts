import OpenAI from 'openai'

/**
 * Boris AI Provider — endpoint-first architecture.
 *
 * Two modes, zero magic:
 *   1. Custom endpoint: set BORIS_TEXT_BASE_URL → uses that
 *   2. OpenAI (default): uses OPENAI_API_KEY with gpt-4o
 *
 * Text and Vision are separate channels so you can run:
 *   - Text locally (cheap)
 *   - Vision in the cloud (stable)
 *
 * Health check: if the primary endpoint times out, Boris falls back
 * to OpenAI gpt-4o-mini and logs "fallback used".
 *
 * ── Text channel ──────────────────────────────────────────────
 *   BORIS_TEXT_BASE_URL      — custom endpoint (omit → OpenAI)
 *   BORIS_TEXT_API_KEY       — key for that endpoint (falls back to OPENAI_API_KEY)
 *   BORIS_TEXT_MODEL         — model name (default: gpt-4o)
 *   BORIS_TEXT_MAX_TOKENS    — max response tokens (default: 1000)
 *   BORIS_TEXT_TEMPERATURE   — 0-2 (default: 0.7)
 *   BORIS_TEXT_TIMEOUT_MS    — request timeout in ms (default: 15000)
 *
 * ── Vision channel ────────────────────────────────────────────
 *   BORIS_VISION_BASE_URL   — custom endpoint (omit → OpenAI)
 *   BORIS_VISION_API_KEY    — key for that endpoint (falls back to OPENAI_API_KEY)
 *   BORIS_VISION_MODEL      — model name (default: gpt-4o)
 *
 * ── Fallback ──────────────────────────────────────────────────
 *   BORIS_FALLBACK_MODEL    — model used when primary times out (default: gpt-4o-mini)
 *
 * All env vars are server-side only (no NEXT_PUBLIC_ prefix).
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type BorisChannel = 'text' | 'vision'

interface ChannelConfig {
  baseURL: string | undefined
  apiKey: string
  model: string
  maxTokens: number
  temperature: number
  timeoutMs: number
}

// ─── Config resolution ───────────────────────────────────────────────────────

const OPENAI_DEFAULT_URL = 'https://api.openai.com/v1'

function resolveKey(channelKey: string | undefined): string {
  return channelKey || process.env.OPENAI_API_KEY || ''
}

function getChannelConfig(channel: BorisChannel): ChannelConfig {
  if (channel === 'vision') {
    return {
      baseURL: process.env.BORIS_VISION_BASE_URL || undefined,
      apiKey: resolveKey(process.env.BORIS_VISION_API_KEY),
      model: process.env.BORIS_VISION_MODEL || 'gpt-4o',
      maxTokens: 1000,
      temperature: 0.7,
      timeoutMs: 30_000, // vision can be slower
    }
  }

  // text channel
  return {
    baseURL: process.env.BORIS_TEXT_BASE_URL || undefined,
    apiKey: resolveKey(process.env.BORIS_TEXT_API_KEY),
    model: process.env.BORIS_TEXT_MODEL || 'gpt-4o',
    maxTokens: parseInt(process.env.BORIS_TEXT_MAX_TOKENS || '1000', 10),
    temperature: parseFloat(process.env.BORIS_TEXT_TEMPERATURE || '0.7'),
    timeoutMs: parseInt(process.env.BORIS_TEXT_TIMEOUT_MS || '15000', 10),
  }
}

function getFallbackConfig(): ChannelConfig {
  return {
    baseURL: undefined, // always OpenAI
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.BORIS_FALLBACK_MODEL || 'gpt-4o-mini',
    maxTokens: 1000,
    temperature: 0.7,
    timeoutMs: 20_000,
  }
}

// ─── Client cache (one per unique baseURL+key combo) ─────────────────────────

const clientCache = new Map<string, OpenAI>()

function getClient(config: ChannelConfig): OpenAI {
  const cacheKey = `${config.baseURL ?? 'openai'}|${config.apiKey.slice(0, 8)}`

  let client = clientCache.get(cacheKey)
  if (!client) {
    client = new OpenAI({
      apiKey: config.apiKey || 'not-needed',
      ...(config.baseURL ? { baseURL: config.baseURL } : {}),
    })
    clientCache.set(cacheKey, client)
  }
  return client
}

// ─── Health check + fallback call ────────────────────────────────────────────

async function callWithTimeout(
  client: OpenAI,
  config: ChannelConfig,
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), config.timeoutMs)

  try {
    const completion = await client.chat.completions.create(
      {
        model: config.model,
        messages,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
      },
      { signal: controller.signal },
    )
    return completion.choices[0]?.message?.content || ''
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Send a chat completion request with automatic fallback.
 *
 * 1. Try the configured channel (text or vision).
 * 2. If it times out or errors → fall back to OpenAI gpt-4o-mini.
 * 3. If fallback also fails → throw.
 */
export async function borisChat(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  channel: BorisChannel = 'text',
): Promise<string> {
  const config = getChannelConfig(channel)
  const client = getClient(config)

  try {
    const result = await callWithTimeout(client, config, messages)
    if (result) return result
    throw new Error('Empty response from primary')
  } catch (primaryError: any) {
    // If the primary IS OpenAI and it's not a timeout, don't fallback — rethrow
    const isCustomEndpoint = !!config.baseURL
    const isTimeout = primaryError?.name === 'AbortError' ||
      primaryError?.code === 'ECONNREFUSED' ||
      primaryError?.code === 'ECONNRESET' ||
      primaryError?.code === 'ETIMEDOUT' ||
      primaryError?.message?.includes('aborted')

    if (!isCustomEndpoint && !isTimeout) {
      throw primaryError
    }

    // Fallback
    console.warn(
      `[Boris] Primary ${channel} endpoint failed (${primaryError?.message || 'unknown'}). ` +
      `Falling back to ${getFallbackConfig().model}.`
    )

    try {
      const fallbackCfg = getFallbackConfig()
      if (!fallbackCfg.apiKey) throw new Error('No OPENAI_API_KEY for fallback')
      const fallbackClient = getClient(fallbackCfg)
      const result = await callWithTimeout(fallbackClient, fallbackCfg, messages)
      if (result) {
        console.info('[Boris] Fallback used successfully.')
        return result
      }
      throw new Error('Empty fallback response')
    } catch (fallbackError: any) {
      console.error('[Boris] Fallback also failed:', fallbackError?.message)
      throw primaryError // throw the original error
    }
  }
}

// ─── Public helpers ──────────────────────────────────────────────────────────

/**
 * Check if Boris AI is configured for a given channel.
 */
export function isBorisConfigured(channel: BorisChannel = 'text'): boolean {
  const config = getChannelConfig(channel)
  // Custom endpoint doesn't need an API key (local AI)
  if (config.baseURL) return true
  // OpenAI needs a real key
  return config.apiKey.length > 0 && !config.apiKey.startsWith('sk-mock')
}

/**
 * Get info about the current provider (for admin/debug, never exposed to client).
 */
export function getProviderInfo(channel: BorisChannel = 'text'): {
  endpoint: string
  model: string
  isCustom: boolean
  fallbackModel: string
} {
  const config = getChannelConfig(channel)
  return {
    endpoint: config.baseURL || OPENAI_DEFAULT_URL,
    model: config.model,
    isCustom: !!config.baseURL,
    fallbackModel: getFallbackConfig().model,
  }
}

// ─── Backwards-compatible exports (used by borisArtAI.ts + wallcraftExpert.ts)

/** @deprecated Use borisChat() directly */
export function getBorisAIClient(): OpenAI {
  return getClient(getChannelConfig('text'))
}

/** @deprecated Use borisChat() directly */
export function getBorisModelConfig(): { model: string; maxTokens: number; temperature: number } {
  const c = getChannelConfig('text')
  return { model: c.model, maxTokens: c.maxTokens, temperature: c.temperature }
}

/** @deprecated Use isBorisConfigured() */
export function isBorisAIConfigured(): boolean {
  return isBorisConfigured('text')
}
