/**
 * Admin AI alert emails via Resend.
 *
 * Sends a plain-text email when an AI service falls back or fails completely.
 * Debounced: max 1 alert per service per 5 minutes to prevent spam during outages.
 */

import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

function getFromEmail() {
  return process.env.EMAIL_FROM || 'Artboris <order@artboris.se>'
}

function getAdminEmail(): string | null {
  return process.env.ADMIN_ALERT_EMAIL || null
}

export interface AIAlertPayload {
  type: 'fallback_triggered' | 'complete_failure'
  service: string
  error: string
  timestamp: string
}

// ── Debounce: max 1 alert per service per 5 minutes ──

const alertCooldowns = new Map<string, number>()
const COOLDOWN_MS = 5 * 60 * 1000

function shouldSendAlert(key: string): boolean {
  const now = Date.now()
  const lastSent = alertCooldowns.get(key) || 0
  if (now - lastSent < COOLDOWN_MS) return false
  alertCooldowns.set(key, now)
  return true
}

export async function sendAIAdminAlert(payload: AIAlertPayload): Promise<void> {
  const adminEmail = getAdminEmail()
  if (!adminEmail) {
    console.warn(`[adminAlert] ADMIN_ALERT_EMAIL not set, skipping alert for ${payload.service}`)
    return
  }

  const cooldownKey = `${payload.type}:${payload.service}`
  if (!shouldSendAlert(cooldownKey)) {
    console.log(`[adminAlert] Skipping (cooldown active): ${cooldownKey}`)
    return
  }

  const isFailure = payload.type === 'complete_failure'
  const subject = isFailure
    ? `AI FAILURE: ${payload.service}`
    : `AI Fallback: ${payload.service}`

  const body = [
    `Type: ${payload.type}`,
    `Service: ${payload.service}`,
    `Error: ${payload.error}`,
    `Time: ${payload.timestamp}`,
    '',
    isFailure
      ? 'The AI service failed completely. Users received an error.'
      : 'The primary AI provider failed and a fallback was used. Users were not affected.',
  ].join('\n')

  try {
    const { error } = await getResend().emails.send({
      from: getFromEmail(),
      to: adminEmail,
      subject,
      text: body,
    })

    if (error) {
      console.error('[adminAlert] Resend error:', error)
    } else {
      console.log(`[adminAlert] Alert sent to ${adminEmail}: ${subject}`)
    }
  } catch (err) {
    console.error('[adminAlert] Failed to send alert email:', err)
  }
}
