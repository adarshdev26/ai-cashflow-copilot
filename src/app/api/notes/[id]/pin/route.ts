import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireWorkspaceAccess } from '@/lib/auth/workspaces';

export const dynamic = 'force-dynamic';

const NOTE_INCLUDE = {
    user: {
        select: {
            id: true,
            name: true,
            email: true,
        },
    },
} as const;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const existing = await prisma.note.findUnique({
            where: { id },
        });

        if (!existing) {
            return NextResponse.json({ error: 'Note not found' }, { status: 404 });
        }

        const access = await requireWorkspaceAccess(req, 'MEMBER', existing.workspaceId);
        if (!access.ok) return access.response;

        const updated = await prisma.note.update({
            where: { id: existing.id },
            data: {
                isPinned: !existing.isPinned,
            },
            include: NOTE_INCLUDE,
        });

        return NextResponse.json({ note: updated });
    } catch (error) {
        console.error('Failed to toggle note pin status:', error);
        return NextResponse.json({ error: 'Failed to toggle note pin status' }, { status: 500 });
    }
}
