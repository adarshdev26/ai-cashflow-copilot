import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getSessionInfo, requireUserId } from '@/lib/auth/auth'

export async function GET() {
  try {
    const userId = await requireUserId()

    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Look up the user, selecting only safe fields (never the password)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, onboardingCompletedAt: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    const session = await getSessionInfo();
    return NextResponse.json({
      ...user,
      impersonating: !!session?.impersonating,
      adminEmail: session?.adminEmail ?? null,
    }, { status: 200 })
  } catch (error) {
    console.error('Get current user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}