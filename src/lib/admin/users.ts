import type { Prisma } from '@/generated/prisma';
import { prisma } from '@/lib/db/prisma';

export const USER_ROW_SELECT = {
  id: true, name: true, email: true, isActive: true, createdAt: true,
  workspaceAccess: {
    orderBy: { createdAt: 'asc' },
    select: { role: true, workspace: { select: { id: true, name: true, ownerId: true, isActive: true } } },
  },
} satisfies Prisma.UserSelect;

type UserRowDb = Prisma.UserGetPayload<{ select: typeof USER_ROW_SELECT }>;
export function toUserRow(u: UserRowDb) {
  return {
    id: u.id, name: u.name, email: u.email, isActive: u.isActive, createdAt: u.createdAt,
    workspaces: u.workspaceAccess.map((a) => ({
      workspaceId: a.workspace.id, name: a.workspace.name, role: a.role,
      isOwner: a.workspace.ownerId === u.id, isActive: a.workspace.isActive,
    })),
  };
}

export const normalizeEmail = (e: string) => e.trim().toLowerCase();
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export async function emailTaken(email: string, excludeUserId?: string) {
  const [user, admin] = await Promise.all([
    prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' }, ...(excludeUserId ? { NOT: { id: excludeUserId } } : {}) },
      select: { id: true },
    }),
    prisma.admin.findUnique({ where: { email }, select: { id: true } }),
  ]);
  return !!user || !!admin;
}
