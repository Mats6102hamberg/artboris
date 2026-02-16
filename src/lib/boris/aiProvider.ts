import OpenAI from 'openai'

/**
 * AI Provider Configuration
 * 
 * Supports any OpenAI-compatible API endpoint:
 * - OpenAI (default): gpt-4o, gpt-4o-mini
 * - Ollama: http://localhost:11434/v1
 * - LM Studio: http://localhost:1234/v1
 * - Any OpenAI-compatible server
 * 
 * Environment variables:
 *   BORIS_AI_PROVIDER   — "openai" | "local" | "custom" (default: "openai")
 *   BORIS_AI_BASE_URL   — Custom base URL (e.g. http://localhost:11434/v1)
 *   BORIS_AI_API_KEY    — API key for the provider (falls back to OPENAI_API_KEY)
 *   BORIS_AI_MODEL      — Model name (default: "gpt-4o")
 *   BORIS_AI_MAX_TOKENS — Max response tokens (default: 1000)
 *   BORIS_AI_TEMPERATURE — Temperature 0-2 (default: 0.7)
 */

interface AIProviderConfig {
  baseURL?: string
  apiKey: string
  model: string
  maxTokens: number
  temperature: number
}

function getProviderConfig(): AIProviderConfig {
  const provider = process.env.BORIS_AI_PROVIDER || 'openai'
  const model = process.env.BORIS_AI_MODEL || 'gpt-4o'
  const maxTokens = parseInt(process.env.BORIS_AI_MAX_TOKENS || '1000', 10)
  const temperature = parseFloat(process.env.BORIS_AI_TEMPERATURE || '0.7')

  switch (provider) {
    case 'local':
      // Auto-detect common local providers
      return {
        baseURL: process.env.BORIS_AI_BASE_URL || 'http://localhost:11434/v1',
        apiKey: process.env.BORIS_AI_API_KEY || 'ollama', // Ollama doesn't need a real key
        model: process.env.BORIS_AI_MODEL || 'llama3',
        maxTokens,
        temperature,
      }

    case 'custom':
      return {
        baseURL: process.env.BORIS_AI_BASE_URL,
        apiKey: process.env.BORIS_AI_API_KEY || process.env.OPENAI_API_KEY || 'sk-mock-key',
        model,
        maxTokens,
        temperature,
      }

    case 'openai':
    default:
      return {
        baseURL: undefined, // Use OpenAI default
        apiKey: process.env.BORIS_AI_API_KEY || process.env.OPENAI_API_KEY || 'sk-mock-key',
        model,
        maxTokens,
        temperature,
      }
  }
}

let clientInstance: OpenAI | null = null
let cachedConfig: AIProviderConfig | null = null

/**
 * Get a configured OpenAI client for Boris AI.
 * Works with any OpenAI-compatible endpoint.
 */
export function getBorisAIClient(): OpenAI {
  const config = getProviderConfig()

  // Recreate client if config changed (env vars can change between deploys)
  const configKey = `${config.baseURL}|${config.apiKey}|${config.model}`
  const cachedKey = cachedConfig ? `${cachedConfig.baseURL}|${cachedConfig.apiKey}|${cachedConfig.model}` : ''

  if (!clientInstance || configKey !== cachedKey) {
    clientInstance = new OpenAI({
      apiKey: config.apiKey,
      ...(config.baseURL ? { baseURL: config.baseURL } : {}),
    })
    cachedConfig = config
  }

  return clientInstance
}

/**
 * Get the current model configuration.
 */
export function getBorisModelConfig(): { model: string; maxTokens: number; temperature: number } {
  const config = getProviderConfig()
  return {
    model: config.model,
    maxTokens: config.maxTokens,
    temperature: config.temperature,
  }
}

/**
 * Check if Boris AI is properly configured.
 */
export function isBorisAIConfigured(): boolean {
  const config = getProviderConfig()
  const provider = process.env.BORIS_AI_PROVIDER || 'openai'

  if (provider === 'local') return true // Local providers don't need API keys
  return config.apiKey !== 'sk-mock-key' && config.apiKey.length > 0
}

/**
 * Get a human-readable description of the current AI provider.
 */
export function getBorisProviderInfo(): { provider: string; model: string; baseURL: string } {
  const config = getProviderConfig()
  const provider = process.env.BORIS_AI_PROVIDER || 'openai'
  return {
    provider,
    model: config.model,
    baseURL: config.baseURL || 'https://api.openai.com/v1',
  }
}
