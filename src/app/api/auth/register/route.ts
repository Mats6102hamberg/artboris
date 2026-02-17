import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email och lösenord krävs' },
        { status: 400 },
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Lösenordet måste vara minst 8 tecken' },
        { status: 400 },
      )
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'En användare med denna email finns redan' },
        { status: 409 },
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    // Read existing anonId cookie
    const store = await cookies()
    const anonId = store.get('ab_anon_id')?.value ?? null

    await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        passwordHash,
        anonId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Registrering misslyckades' },
      { status: 500 },
    )
  }
}
