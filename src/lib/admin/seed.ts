import { prisma } from '@/lib/db/prisma';
import { hashPassword } from '@/lib/users/users';

/** Creates the configured admin account once without overwriting an existing password. */
export async function ensureSeededAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn('[admin-seed] ADMIN_EMAIL / ADMIN_PASSWORD missing, skipping');
    return;
  }
  const existing = await prisma.admin.findUnique({ where: { email }, select: { id: true } });
  if (existing) return;
  try {
    await prisma.admin.create({ data: { email, name: 'Admin', password: await hashPassword(password) } });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code !== 'P2002') throw e;
  }
}
