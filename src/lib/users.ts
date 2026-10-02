import bcrypt from 'bcryptjs'
import { generateWorkspaceSlug } from '@/lib/workspaces'
import type { TxClient } from '@/lib/db-types'

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Same writes as signup: user + "Personal" workspace + OWNER access + default account. Must run inside a transaction. */
export async function createUserWithPersonalWorkspaceTx(
  tx: TxClient,
  data: { email: string; hashedPassword: string; name?: string | null }
) {
  const user = await tx.user.create({
    data: { email: data.email, password: data.hashedPassword, name: data.name },
  })
  await tx.workspace.create({
    data: {
      name: 'Personal',
      slug: generateWorkspaceSlug('Personal'),
      ownerId: user.id,
      access: { create: { userId: user.id, role: 'OWNER' } },
      // New workspaces get the workspace default currency (INR), same as the account default
      accounts: { create: { name: 'General', type: 'OTHER' } },
    },
  })
  return user
}