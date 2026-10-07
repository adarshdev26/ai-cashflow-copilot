import { NextResponse } from 'next/server';
import type { Prisma } from '@/generated/prisma';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/admin/auth';
import { parseListParams, paginationMeta } from '@/lib/admin/list';
import {
    USER_ROW_SELECT,
    toUserRow,
    normalizeEmail,
    EMAIL_RE,
    emailTaken,
} from '@/lib/admin/users';
import { hashPassword, createUserWithPersonalWorkspaceTx } from '@/lib/users/users';
import { getSystemNumber } from '@/lib/settings/server';
import { adminActor, logAudit } from '@/lib/admin/audit';
import { AUDIT_ACTIONS } from '@/lib/admin/audit-events';

export async function GET(req: Request) {
    const g = await requireAdmin();
    if (!g.ok) return g.response;

    const p = parseListParams(
        new URL(req.url),
        ['createdAt', 'name', 'email', 'isActive', 'plan'],
        'createdAt',
        await getSystemNumber('limits.listMaxPageSize'),
    );
    const where: Prisma.UserWhereInput = {
        ...(p.isActive !== undefined ? { isActive: p.isActive } : {}),
        ...(p.search
            ? {
                  OR: [
                      { name: { contains: p.search, mode: 'insensitive' } },
                      { email: { contains: p.search, mode: 'insensitive' } },
                  ],
              }
            : {}),
    };

    const [rows, totalCount] = await Promise.all([
        prisma.user.findMany({
            where,
            select: USER_ROW_SELECT,
            orderBy: [{ [p.sortBy]: p.sortDir }, { id: 'asc' }],
            skip: p.skip,
            take: p.limit,
        }),
        prisma.user.count({ where }),
    ]);

    return NextResponse.json({
        data: rows.map(toUserRow),
        pagination: paginationMeta(p.page, p.limit, totalCount),
    });
}

export async function POST(req: Request) {
    const g = await requireAdmin();
    if (!g.ok) return g.response;

    const body = await req.json().catch(() => null);
    const email = typeof body?.email === 'string' ? normalizeEmail(body.email) : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    const name = typeof body?.name === 'string' && body.name.trim() ? body.name.trim() : null;

    if (!EMAIL_RE.test(email))
        return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
    if (password.length < (await getSystemNumber('auth.passwordMinLength')) || password.length > 72)
        return NextResponse.json(
            {
                error: `Password must be ${await getSystemNumber('auth.passwordMinLength')}-72 characters`,
            },
            { status: 400 },
        );
    if (await emailTaken(email))
        return NextResponse.json({ error: 'Email is already in use' }, { status: 409 });

    const hashedPassword = await hashPassword(password);
    const user = await prisma.$transaction((tx) =>
        createUserWithPersonalWorkspaceTx(tx, { email, hashedPassword, name }),
    );

    await logAudit({
        actor: await adminActor(g.adminId),
        action: AUDIT_ACTIONS.USER_CREATED,
        resourceType: 'user',
        resourceId: user.id,
        metadata: { targetName: user.name, targetEmail: user.email },
        request: req,
    });

    return NextResponse.json(
        { user: { id: user.id, email: user.email, name: user.name } },
        { status: 201 },
    );
}
