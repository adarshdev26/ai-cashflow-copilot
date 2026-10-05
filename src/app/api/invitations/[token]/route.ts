import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getSession } from '@/lib/auth/auth'
import { findInvitationByToken, assertInvitationUsable, emailsMatch } from '@/lib/users/invitations'
import { invitationErrorResponse } from '@/lib/users/invitation-http'

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    const invitation = await findInvitationByToken(token)
    if (!invitation) {
      return NextResponse.json({ error: 'Invalid invitation link', code: 'INVALID' }, { status: 404 })
    }
    assertInvitationUsable(invitation) // throws EXPIRED / ACCEPTED / CANCELLED

    const account = await prisma.user.findFirst({
      where: { email: { equals: invitation.email, mode: 'insensitive' } },
      select: { id: true },
    })

    // Lets the landing page pick its state without a second request.
    const session = await getSession()
    const viewer = {
      signedIn: !!session,
      emailMatches: !!session && emailsMatch(session.email, invitation.email),
    }

    return NextResponse.json({
      workspaceName: invitation.workspace.name,
      role: invitation.role,
      email: invitation.email,
      expiresAt: invitation.expiresAt,
      accountExists: !!account,
      viewer,
    })
  } catch (error) {
    return invitationErrorResponse(error, 'Invitation preview error')
  }
}