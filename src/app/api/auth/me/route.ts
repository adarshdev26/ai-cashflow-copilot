import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

import { getJwtSecret } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    // Read the cookie set by the login route
    const token = req.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Verify the JWT (throws if invalid or expired)
    let payload: { userId: string }
    try {
      payload = jwt.verify(token, getJwtSecret()) as { userId: string }
    } catch {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    // Look up the user, selecting only safe fields (never the password)
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, email: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    return NextResponse.json(user, { status: 200 })
  } catch (error) {
    console.error('Get current user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}