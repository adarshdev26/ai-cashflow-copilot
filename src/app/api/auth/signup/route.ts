import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { createUserWithPersonalWorkspaceTx, hashPassword } from '@/lib/users'

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: email.trim(), mode: 'insensitive' } },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 400 }
      )
    }

    // Hash password (bcrypt, 10 rounds, same as before)
    const hashedPassword = await hashPassword(password)

    // Create user, default workspace and OWNER access together (all or nothing)
    const user = await prisma.$transaction((tx) =>
      createUserWithPersonalWorkspaceTx(tx, { email, hashedPassword, name })
    )

    return NextResponse.json(
      { message: 'User created successfully', userId: user.id },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}