import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { setAuthCookie } from '@/lib/auth'
import {
  InvitationError,
  findInvitationByToken,
  assertInvitationUsable,
  acceptInvitationTx,
} from '@/lib/invitations'
import { invitationErrorResponse } from '@/lib/invitation-http'
import { createUserWithPersonalWorkspaceTx, hashPassword } from '@/lib/users'

const accountExistsResponse = () =>
  NextResponse.json(
    { error: 'An account already exists for this email. Please sign in.', code: 'ACCOUNT_EXISTS' },
    { status: 409 }
  )

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    const { name, password } = await req.json()
    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    const invitation = await findInvitationByToken(token)
    if (!invitation) throw new InvitationError('INVALID')
    assertInvitationUsable(invitation)

    // Email comes only from the invitation, never from the request body.
    const findAccount = () =>
      prisma.user.findFirst({
        where: { email: { equals: invitation.email, mode: 'insensitive' } },
        select: { id: true },
      })

    if (await findAccount()) return accountExistsResponse()

    const hashedPassword = await hashPassword(password) // outside the tx: bcrypt is slow

    let user
    try {
      user = await prisma.$transaction(async (tx) => {
        const created = await createUserWithPersonalWorkspaceTx(tx, {
          email: invitation.email,
          hashedPassword,
          name: typeof name === 'string' ? name : undefined,
        })
        await acceptInvitationTx(tx, invitation, created.id)
        return created
      })
    } catch (e) {
      // P2002 can also come from something unrelated (e.g. a workspace slug
      // collision), so only report "account exists" if the account really exists.
      if ((e as { code?: string })?.code === 'P2002' && (await findAccount())) {
        return accountExistsResponse()
      }
      throw e
    }

    await setAuthCookie(user)
    return NextResponse.json(
      { message: 'Account created', userId: user.id, workspaceId: invitation.workspaceId },
      { status: 201 }
    )
  } catch (error) {
    return invitationErrorResponse(error, 'Invitation register error')
  }
}