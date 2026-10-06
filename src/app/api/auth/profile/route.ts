import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

export async function PATCH(req: Request) {
    try {
        const userId = await requireUserId();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json().catch(() => null);
        const name = typeof body?.name === 'string' ? body.name.trim() : '';

        if (name.length < 1 || name.length > 60) {
            return NextResponse.json({ error: 'Name must be 1 to 60 characters' }, { status: 400 });
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: { name },
            select: { id: true, name: true, email: true },
        });

        return NextResponse.json(user, { status: 200 });
    } catch (error) {
        console.error('Update profile error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
