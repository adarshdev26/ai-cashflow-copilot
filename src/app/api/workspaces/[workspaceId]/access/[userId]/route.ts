import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireWorkspaceAccess } from '@/lib/workspaces';
import { WorkspaceRole } from '@/generated/prisma';

export async function PATCH(req: Request, { params }: { params: Promise<{ workspaceId: string, userId: string }> }) {
  try {
    const { workspaceId, userId: targetUserId } = await params;
    const access = await requireWorkspaceAccess(req, 'ADMIN', workspaceId);
    if (!access.ok) return access.response;

    const body = await req.json();
    const { role } = body;

    if (!role || !['ADMIN', 'MEMBER', 'VIEWER'].includes(role)) {
      return NextResponse.json({ error: 'Valid role (ADMIN, MEMBER, VIEWER) is required' }, { status: 400 });
    }

    const targetAccess = await prisma.workspaceAccess.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: access.workspaceId,
          userId: targetUserId,
        },
      },
    });

    if (!targetAccess) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    if (targetAccess.role === 'OWNER') {
      return NextResponse.json({ error: 'Cannot modify the role of an OWNER' }, { status: 403 });
    }

    const updatedAccess = await prisma.workspaceAccess.update({
      where: {
        workspaceId_userId: {
          workspaceId: access.workspaceId,
          userId: targetUserId,
        },
      },
      data: { role: role as WorkspaceRole },
      include: {
        user: {
          select: { id: true, email: true },
        },
      },
    });

    return NextResponse.json(updatedAccess);
  } catch (error) {
    console.error('Failed to update member role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ workspaceId: string, userId: string }> }) {
  try {
    const { workspaceId, userId: targetUserId } = await params;
    const access = await requireWorkspaceAccess(req, 'ADMIN', workspaceId);
    if (!access.ok) return access.response;

    const targetAccess = await prisma.workspaceAccess.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: access.workspaceId,
          userId: targetUserId,
        },
      },
    });

    if (!targetAccess) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Ownership can't be transferred yet, so the owner is never removable.
    if (targetAccess.role === 'OWNER') {
      return NextResponse.json({ error: 'Cannot remove the workspace owner' }, { status: 403 });
    }

    await prisma.workspaceAccess.delete({
      where: {
        workspaceId_userId: {
          workspaceId: access.workspaceId,
          userId: targetUserId,
        },
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Failed to remove member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
