import { prisma } from '@/lib/db/prisma';

type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
export type MemberResult = { ok: true } | { ok: false; status: number; error: string };

export async function transferWorkspaceOwnership(workspaceId: string, newOwnerId: string): Promise<MemberResult> {
  return prisma.$transaction(async (tx) => {
    const ws = await tx.workspace.findUnique({ where: { id: workspaceId }, select: { ownerId: true } });
    if (!ws) return { ok: false, status: 404, error: 'Workspace not found' };
    if (ws.ownerId === newOwnerId) return { ok: true };
    await tx.workspaceAccess.upsert({
      where: { workspaceId_userId: { workspaceId, userId: newOwnerId } },
      update: { role: 'OWNER' },
      create: { workspaceId, userId: newOwnerId, role: 'OWNER' },
    });
    await tx.workspaceAccess.updateMany({ where: { workspaceId, userId: ws.ownerId }, data: { role: 'ADMIN' } });
    await tx.workspace.update({ where: { id: workspaceId }, data: { ownerId: newOwnerId } });
    return { ok: true };
  });
}

export async function setMemberRole(workspaceId: string, userId: string, role: WorkspaceRole): Promise<MemberResult> {
  const [ws, user] = await Promise.all([
    prisma.workspace.findUnique({ where: { id: workspaceId }, select: { ownerId: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
  ]);
  if (!ws) return { ok: false, status: 404, error: 'Workspace not found' };
  if (!user) return { ok: false, status: 404, error: 'User not found' };
  if (role === 'OWNER') return transferWorkspaceOwnership(workspaceId, userId);
  if (ws.ownerId === userId) return { ok: false, status: 400, error: 'Make another member the owner before changing the owner\'s role' };
  await prisma.workspaceAccess.upsert({
    where: { workspaceId_userId: { workspaceId, userId } },
    update: { role },
    create: { workspaceId, userId, role },
  });
  return { ok: true };
}

export async function removeMember(workspaceId: string, userId: string): Promise<MemberResult> {
  const ws = await prisma.workspace.findUnique({ where: { id: workspaceId }, select: { ownerId: true } });
  if (!ws) return { ok: false, status: 404, error: 'Workspace not found' };
  if (ws.ownerId === userId) return { ok: false, status: 400, error: 'The owner cannot be removed. Transfer ownership first' };
  await prisma.workspaceAccess.deleteMany({ where: { workspaceId, userId } });
  return { ok: true };
}
