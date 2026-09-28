import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireWorkspaceAccess } from '@/lib/workspaces';

export async function GET(req: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params;
    const access = await requireWorkspaceAccess(req, 'VIEWER', workspaceId);
    if (!access.ok) return access.response;

    const workspace = await prisma.workspace.findUnique({
      where: { id: access.workspaceId },
      include: {
        access: {
          include: {
            user: {
              select: { id: true, email: true },
            },
          },
        },
      },
    });

    if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });

    return NextResponse.json(workspace);
  } catch (error) {
    console.error('Failed to get workspace:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params;
    const access = await requireWorkspaceAccess(req, 'ADMIN', workspaceId);
    if (!access.ok) return access.response;

    const body = await req.json();
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      return NextResponse.json({ error: 'Workspace name is required' }, { status: 400 });
    }

    const workspace = await prisma.workspace.update({
      where: { id: access.workspaceId },
      data: { name: body.name.trim() },
    });

    return NextResponse.json(workspace);
  } catch (error) {
    console.error('Failed to update workspace:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params;
    const access = await requireWorkspaceAccess(req, 'OWNER', workspaceId);
    if (!access.ok) return access.response;

    await prisma.workspace.delete({
      where: { id: access.workspaceId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Failed to delete workspace:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
