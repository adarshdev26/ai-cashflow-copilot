import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireWorkspaceAction } from '@/lib/auth/workspaces';
import { getSystemBool } from '@/lib/settings/server';
import { generateInvitationToken, getExpiryDate, invitationSelect } from '@/lib/users/invitations';
import { logAudit, userActor } from '@/lib/admin/audit';
import { AUDIT_ACTIONS } from '@/lib/admin/audit-events';

type Ctx = { params: Promise<{ workspaceId: string; invitationId: string }> };

// "Resend" = rotate the token. The old link dies, a new one is returned once.
export async function POST(req: Request, { params }: Ctx) {
    try {
        const { workspaceId, invitationId } = await params;
        const access = await requireWorkspaceAction(req, 'members.invite', workspaceId);
        if (!access.ok) return access.response;
        if (!(await getSystemBool('features.invitationsEnabled'))) {
            return NextResponse.json(
                { error: 'Invitations are currently disabled' },
                { status: 403 },
            );
        }

        const existing = await prisma.workspaceInvitation.findFirst({
            where: { id: invitationId, workspaceId: access.workspaceId, status: 'PENDING' },
            select: { id: true, email: true, role: true, expiresAt: true },
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
                { status: 409 },
            );
        }

        const { token, tokenHash } = generateInvitationToken();

        // status: 'PENDING' in the where guards against a cancel racing this resend.
        // invitedById becomes the person resending: they are authorized right now,
        // and accept re-checks that the inviter still has permission.
        let invitation;
        try {
            invitation = await prisma.workspaceInvitation.update({
                where: { id: existing.id, workspaceId: access.workspaceId, status: 'PENDING' },
                data: { tokenHash, expiresAt: await getExpiryDate(), invitedById: access.userId },
                select: invitationSelect,
            });
        } catch (err) {
            if ((err as { code?: string }).code === 'P2025') {
                return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
            }
            throw err;
        }

        await logAudit({
            actor: await userActor(access.userId),
            action: AUDIT_ACTIONS.WORKSPACE_INVITATION_RESENT,
            resourceType: 'invitation',
            resourceId: invitation.id,
            workspaceId: access.workspaceId,
            metadata: {
                targetEmail: invitation.email,
                role: invitation.role,
                before: { expiresAt: existing.expiresAt },
                after: { expiresAt: invitation.expiresAt },
            },
        });

        return NextResponse.json(
            { invitation, token },
            { headers: { 'Cache-Control': 'no-store' } },
        );
    } catch (error) {
        console.error('Failed to resend invitation:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
