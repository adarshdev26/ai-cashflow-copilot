import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireWorkspaceAction } from '@/lib/auth/workspaces';
import { getSystemBool } from '@/lib/settings/server';
import {
  generateInvitationToken,
  getExpiryDate,
  invitationSelect,
  isInvitableRole,
  isValidEmail,
  normalizeEmail,
} from '@/lib/users/invitations';

type Ctx = { params: Promise<{ workspaceId: string }> };

// List pending invitations (expired-but-unaccepted ones are included so the UI
// can show "Expired" with a Resend button).
export async function GET(req: Request, { params }: Ctx) {
  try {
    const { workspaceId } = await params;
    const access = await requireWorkspaceAction(req, 'members.invite', workspaceId);
    if (!access.ok) return access.response;
    if (!(await getSystemBool('features.invitationsEnabled'))) {
      return NextResponse.json({ error: 'Invitations are currently disabled' }, { status: 403 });
    }

    const invitations = await prisma.workspaceInvitation.findMany({
      where: { workspaceId: access.workspaceId, status: 'PENDING' },
      select: invitationSelect,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(invitations);
  } catch (error) {
    console.error('Failed to list invitations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create an invitation. Returns the raw token ONCE.
export async function POST(req: Request, { params }: Ctx) {
  try {
    const { workspaceId } = await params;
    const access = await requireWorkspaceAction(req, 'members.invite', workspaceId);
    if (!access.ok) return access.response;

    let body: { email?: unknown; role?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const email = normalizeEmail(typeof body.email === 'string' ? body.email : '');
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 });
    }

    const role: unknown = body.role;
    if (role === 'OWNER') {
      return NextResponse.json(
        { error: 'The OWNER role cannot be assigned through an invitation' },
        { status: 400 }
      );
    }
    if (!isInvitableRole(role)) {
      return NextResponse.json(
        { error: 'Role must be ADMIN, MEMBER or VIEWER' },
        { status: 400 }
      );
    }

    // Already a member? (case-insensitive: User.email may not be lowercased)
    const existingMember = await prisma.workspaceAccess.findFirst({
      where: {
        workspaceId: access.workspaceId,
        user: { email: { equals: email, mode: 'insensitive' } },
      },
      select: { id: true },
    });
    if (existingMember) {
      return NextResponse.json(
        { error: 'This person is already a member of this workspace' },
        { status: 409 }
      );
    }

    const { token, tokenHash } = generateInvitationToken();

    // Only one live invite per (workspace, email): cancel older pending ones,
    // then create the new one, atomically.
    const [, invitation] = await prisma.$transaction([
      prisma.workspaceInvitation.updateMany({
        where: { workspaceId: access.workspaceId, email, status: 'PENDING' },
        data: { status: 'CANCELLED' },
      }),
      prisma.workspaceInvitation.create({
        data: {
          workspaceId: access.workspaceId,
          email,
          role,
          tokenHash,
          expiresAt: await getExpiryDate(),
          invitedById: access.userId,
        },
        select: invitationSelect,
      }),
    ]);

    return NextResponse.json(
      { invitation, token },
      { status: 201, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Failed to create invitation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
