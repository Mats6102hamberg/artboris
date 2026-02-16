import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/checkout/route'
import { prisma } from '@/lib/prisma'

// Mock Stripe
const mockSessionCreate = vi.fn()
vi.mock('stripe', () => {
  return {
    default: class MockStripe {
      checkout = { sessions: { create: mockSessionCreate } }
    },
  }
})

const validItem = {
  designId: 'design_1',
  productType: 'POSTER',
  sizeCode: '50x70',
  frameColor: 'NONE',
  paperType: 'DEFAULT',
  quantity: 1,
  unitPriceCents: 34900,
}

const validShipping = {
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  phone: '0701234567',
  address: 'Testgatan 1',
  postalCode: '11122',
  city: 'Stockholm',
}

function makeRequest(body: unknown) {
  return new Request('http://localhost:3000/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake'
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
  })

  it('returns 400 when no items provided', async () => {
    const res = await POST(makeRequest({ items: [], shipping: validShipping }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('Inga artiklar')
  })

  it('returns 400 when shipping is missing', async () => {
    const res = await POST(makeRequest({ items: [validItem] }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('Leveransuppgifter')
  })

  it('returns 400 when item fields are missing', async () => {
    const badItem = { ...validItem, designId: undefined }
    const res = await POST(makeRequest({ items: [badItem], shipping: validShipping }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('saknar fält')
  })

  it('returns 400 for invalid productType', async () => {
    const badItem = { ...validItem, productType: 'INVALID_TYPE' }
    const res = await POST(makeRequest({ items: [badItem], shipping: validShipping }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('Ogiltig produkttyp')
  })

  it('returns 400 for invalid frameColor', async () => {
    const badItem = { ...validItem, frameColor: 'PINK' }
    const res = await POST(makeRequest({ items: [badItem], shipping: validShipping }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('Ogiltig ramfärg')
  })

  it('returns 400 for invalid paperType', async () => {
    const badItem = { ...validItem, paperType: 'SILK' }
    const res = await POST(makeRequest({ items: [badItem], shipping: validShipping }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('Ogiltig papperstyp')
  })

  it('returns 400 when designId does not exist in DB', async () => {
    vi.mocked(prisma.design.findMany).mockResolvedValue([])
    const res = await POST(makeRequest({ items: [validItem], shipping: validShipping }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('hittades inte')
  })

  it('returns 500 when STRIPE_SECRET_KEY is missing', async () => {
    delete process.env.STRIPE_SECRET_KEY
    vi.mocked(prisma.design.findMany).mockResolvedValue([{ id: 'design_1' }] as any)
    const res = await POST(makeRequest({ items: [validItem], shipping: validShipping }))
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toContain('STRIPE_SECRET_KEY')
  })

  it('creates order and returns Stripe URL on success', async () => {
    vi.mocked(prisma.design.findMany).mockResolvedValue([{ id: 'design_1' }] as any)
    vi.mocked(prisma.order.create).mockResolvedValue({
      id: 'order_1',
      payment: { id: 'pay_1' },
      items: [],
    } as any)
    vi.mocked(prisma.payment.update).mockResolvedValue({} as any)
    mockSessionCreate.mockResolvedValue({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/test',
    })

    const res = await POST(makeRequest({ items: [validItem], shipping: validShipping }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.url).toBe('https://checkout.stripe.com/test')
    expect(data.orderId).toBe('order_1')
  })

  it('rolls back order to CANCELED when Stripe session fails', async () => {
    vi.mocked(prisma.design.findMany).mockResolvedValue([{ id: 'design_1' }] as any)
    vi.mocked(prisma.order.create).mockResolvedValue({
      id: 'order_rollback',
      payment: { id: 'pay_1' },
      items: [],
    } as any)
    mockSessionCreate.mockRejectedValue(new Error('Stripe down'))
    vi.mocked(prisma.order.update).mockResolvedValue({} as any)

    const res = await POST(makeRequest({ items: [validItem], shipping: validShipping }))
    expect(res.status).toBe(500)
    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: 'order_rollback' },
      data: { status: 'CANCELED' },
    })
  })
})
