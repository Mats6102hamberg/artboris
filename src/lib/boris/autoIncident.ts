import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

/**
 * Boris M — Auto-create INCIDENT memory when a significant error occurs.
 * Call this from API error handlers to build Boris's knowledge base.
 * Non-blocking — never throws.
 */
export async function borisLogIncident(opts: {
  title: string
  description: string
  tags?: string[]
  data?: Record<string, unknown>
}) {
  try {
    // Deduplicate: don't create if same title exists unresolved in last 24h
    const recent = await prisma.borisMemory.findFirst({
      where: {
        type: 'INCIDENT',
        title: opts.title,
        resolved: false,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    })

    if (recent) {
      // Update existing — bump confidence
      await prisma.borisMemory.update({
        where: { id: recent.id },
        data: {
          confidence: Math.min(1.0, (recent.confidence || 0.5) + 0.1),
          description: `${opts.description}\n\n[Upprepat ${new Date().toISOString()}]`,
        },
      })
      return
    }

    await prisma.borisMemory.create({
      data: {
        type: 'INCIDENT',
        title: opts.title,
        description: opts.description,
        tags: opts.tags ?? [],
        data: (opts.data as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        confidence: 0.5,
      },
    })
  } catch {
    // Silent — Boris logging should never break the app
  }
}

/**
 * Boris M — Log a UX learning (e.g. after an experiment or UI change).
 */
export async function borisLogLearning(opts: {
  title: string
  description: string
  tags?: string[]
  data?: Record<string, unknown>
  confidence?: number
}) {
  try {
    await prisma.borisMemory.create({
      data: {
        type: 'UX_LEARNING',
        title: opts.title,
        description: opts.description,
        tags: opts.tags ?? [],
        data: (opts.data as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        confidence: opts.confidence ?? 0.5,
      },
    })
  } catch {
    // Silent
  }
}
