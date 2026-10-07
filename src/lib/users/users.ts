import bcrypt from 'bcryptjs';
import { generateWorkspaceSlug } from '@/lib/auth/workspaces';
import type { TxClient } from '@/lib/db/db-types';
import { getSystemString } from '@/lib/settings/server';

export function hashPassword(password: string) {
    return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

/** Same writes as signup: user + default workspace + OWNER access + default account. Must run inside a transaction. */
export async function createUserWithPersonalWorkspaceTx(
    tx: TxClient,
    data: { email: string; hashedPassword: string; name?: string | null },
) {
    const [defaultAccountName, defaultWorkspaceName] = await Promise.all([
        getSystemString('workspace.defaultAccountName'),
        getSystemString('workspace.defaultWorkspaceName'),
    ]);
    const user = await tx.user.create({
        data: { email: data.email, password: data.hashedPassword, name: data.name },
    });
    await tx.workspace.create({
        data: {
            name: defaultWorkspaceName,
            slug: generateWorkspaceSlug(defaultWorkspaceName),
            ownerId: user.id,
            access: { create: { userId: user.id, role: 'OWNER' } },
            // New workspaces get the workspace default currency (INR), same as the account default
            accounts: {
                create: {
                    name: defaultAccountName,
                    type: 'OTHER',
                    classification: 'ASSET',
                },
            },
        },
    });
    return user;
}
