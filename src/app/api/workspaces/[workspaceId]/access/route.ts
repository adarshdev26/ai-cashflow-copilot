import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireWorkspaceAccess } from '@/lib/auth/workspaces';
import { WorkspaceRole } from '@/generated/prisma';
import { logAudit, userActor } from '@/lib/admin/audit';
import { AUDIT_ACTIONS } from '@/lib/admin/audit-events';
import { enforceWorkspaceLimit } from '@/lib/plans/server';

export async function GET(req: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
    try {
        const { workspaceId } = await params;
        const access = await requireWorkspaceAccess(req, 'ADMIN', workspaceId);
        if (!access.ok) return access.response;

        const members = await prisma.workspaceAccess.findMany({
            where: { workspaceId: access.workspaceId },
            include: {
                user: {
                    select: { id: true, email: true },
                },
            },
            orderBy: { createdAt: 'asc' },
        });

        return NextResponse.json(members);
    } catch (error) {
        console.error('Failed to get workspace access list:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
    try {
        const { workspaceId } = await params;
        const access = await requireWorkspaceAccess(req, 'ADMIN', workspaceId);
        if (!access.ok) return access.response;

        const body = await req.json();
        const { email, role } = body;

        if (!email || !role || !['ADMIN', 'MEMBER', 'VIEWER'].includes(role)) {
            return NextResponse.json(
                { error: 'Valid email and role (ADMIN, MEMBER, VIEWER) are required' },
                { status: 400 },
            );
        }

        if (role === 'OWNER') {
            return NextResponse.json(
                { error: 'Cannot grant OWNER role directly' },
                { status: 400 },
            );
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const existingAccess = await prisma.workspaceAccess.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId: access.workspaceId,
                    userId: user.id,
                },
            },
        });

        if (existingAccess) {
            return NextResponse.json({ error: 'User is already a member' }, { status: 409 });
        }

        const blocked = await enforceWorkspaceLimit(workspaceId, 'maxCollaborators');
        if (blocked) return blocked;

        const newAccess = await prisma.workspaceAccess.create({
            data: {
                workspaceId: access.workspaceId,
                userId: user.id,
                role: role as WorkspaceRole,
            },
            include: {
                user: {
                    select: { id: true, email: true },
                },
            },
        });

        await logAudit({
            actor: await userActor(access.userId),
            action: AUDIT_ACTIONS.WORKSPACE_MEMBER_ADDED,
            resourceType: 'workspace',
            resourceId: access.workspaceId,
            workspaceId: access.workspaceId,
            metadata: {
                targetUserId: user.id,
                targetEmail: newAccess.user.email,
                role: newAccess.role,
            },
        });

        return NextResponse.json(newAccess, { status: 201 });
    } catch (error) {
        console.error('Failed to add workspace member:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
