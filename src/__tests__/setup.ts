import { vi } from 'vitest'

// Mock Next.js cookies (used by getOrCreateAnonId)
vi.mock('next/headers', () => ({
  cookies: vi.fn(() =>
    Promise.resolve({
      get: vi.fn(() => ({ value: 'anon_test_123' })),
      set: vi.fn(),
    })
  ),
}))

// Mock getOrCreateAnonId
vi.mock('@/lib/anonId', () => ({
  getOrCreateAnonId: vi.fn(() => Promise.resolve('anon_test_123')),
}))

// Mock Prisma client
vi.mock('@/lib/prisma', () => ({
  prisma: {
    design: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    designVariant: {
      findMany: vi.fn(),
    },
    order: {
      create: vi.fn(),
      update: vi.fn(),
    },
    payment: {
      update: vi.fn(),
    },
    artwork: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    dailyUsage: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
  },
}))
