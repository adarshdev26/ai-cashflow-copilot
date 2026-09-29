import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireWorkspaceAction } from '@/lib/workspaces';
import { generateInvitationToken, getExpiryDate, invitationSelect } from '@/lib/invitations';

type Ctx = { params: Promise<{ workspaceId: string; invitationId: string }> };

// "Resend" = rotate the token. The old link dies, a new one is returned once.
export async function POST(req: Request, { params }: Ctx) {
  try {
    const { workspaceId, invitationId } = await params;
    const access = await requireWorkspaceAction(req, 'members.invite', workspaceId);
    if (!access.ok) return access.response;

    const existing = await prisma.workspaceInvitation.findFirst({
      where: { id: invitationId, workspaceId: access.workspaceId, status: 'PENDING' },
      select: { id: true, email: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // They may have joined by another route since the invite was sent.
    const alreadyMember = await prisma.workspaceAccess.findFirst({
      where: {
        workspaceId: access.workspaceId,
        user: { email: { equals: existing.email, mode: 'insensitive' } },
      },
      select: { id: true },
    });
    if (alreadyMember) {
      return NextResponse.json(
        { error: 'This person is already a member of this workspace' },
        { status: 409 }
      );
    }

    const { token, tokenHash } = generateInvitationToken();

    // status: 'PENDING' in the where guards against a cancel racing this resend.
    // invitedById becomes the person resending: they are authorized right now,
    // and accept re-checks that the inviter still has permission.
    let invitation;
    try {
      invitation = await prisma.workspaceInvitation.update({
        where: { id: existing.id, status: 'PENDING' },
        data: { tokenHash, expiresAt: getExpiryDate(), invitedById: access.userId },
        select: invitationSelect,
      });
    } catch (err) {
      if ((err as { code?: string }).code === 'P2025') {
        return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
      }
      throw err;
    }

    return NextResponse.json({ invitation, token }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Failed to resend invitation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}