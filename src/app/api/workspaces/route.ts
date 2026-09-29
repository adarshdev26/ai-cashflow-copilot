import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUserId } from '@/lib/auth';
import { getUserWorkspaces, generateWorkspaceSlug } from '@/lib/workspaces';

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  return NextResponse.json({ workspaces: await getUserWorkspaces(userId) });
}

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (name.length < 2 || name.length > 60) {
    return NextResponse.json({ error: 'Name must be 2-60 characters' }, { status: 400 });
  }

  const workspace = await prisma.workspace.create({
    data: {
      name,
      slug: generateWorkspaceSlug(name),
      ownerId: userId,
      access: { create: { userId, role: 'OWNER' } },
      accounts: { create: { name: 'General', type: 'OTHER' } },
    },
    select: { id: true, name: true, slug: true },
  });

  return NextResponse.json(
    { workspace: { workspaceId: workspace.id, role: 'OWNER', name: workspace.name, slug: workspace.slug } },
    { status: 201 }
  );
}