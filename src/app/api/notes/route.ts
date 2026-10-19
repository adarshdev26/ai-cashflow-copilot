import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireWorkspaceAccess } from '@/lib/auth/workspaces';
import { requireUserId } from '@/lib/auth/auth';
import { validateCreateNote, NOTE_CATEGORIES } from '@/features/notes/lib/validate-note';
import type { NoteCategory, NoteSortBy, NoteSortDir } from '@/features/notes/types';
import type { Prisma } from '@/generated/prisma';

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

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const queryWorkspaceId = searchParams.get('workspaceId') || undefined;
        let targetWorkspaceId = req.headers.get('x-workspace-id') || queryWorkspaceId;

        if (!targetWorkspaceId) {
            const userId = await requireUserId();
            if (!userId) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            const userWorkspace = await prisma.workspaceAccess.findFirst({
                where: { userId, workspace: { isActive: true } },
                select: { workspaceId: true },
                orderBy: { createdAt: 'asc' },
            });
            if (userWorkspace) {
                targetWorkspaceId = userWorkspace.workspaceId;
            }
        }

        const access = await requireWorkspaceAccess(req, 'VIEWER', targetWorkspaceId ?? undefined);
        if (!access.ok) return access.response;

        const search = searchParams.get('search')?.trim();
        const status = searchParams.get('status')?.toUpperCase();
        const rawCategory = searchParams.get('category')?.toUpperCase();
        const sortBy = (searchParams.get('sortBy') ?? 'createdAt') as NoteSortBy;
        const sortDir = (searchParams.get('sortDir') ?? 'desc') as NoteSortDir;

        const where: Prisma.NoteWhereInput = {
            workspaceId: access.workspaceId,
        };

        // Soft-delete filtering:
        // 'ARCHIVED' shows soft-deleted notes.
        // Any other status ('ALL', 'PENDING', 'COMPLETED') shows only active (non-deleted) notes.
        if (status === 'ARCHIVED') {
            where.deletedAt = { not: null };
        } else {
            where.deletedAt = null;

            if (status === 'PENDING') {
                where.isCompleted = false;
            } else if (status === 'COMPLETED') {
                where.isCompleted = true;
            }
        }

        if (rawCategory && rawCategory !== 'ALL') {
            if (NOTE_CATEGORIES.includes(rawCategory as NoteCategory)) {
                where.category = rawCategory as NoteCategory;
            }
        }

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } },
            ];
        }

        const validSortFields: NoteSortBy[] = [
            'createdAt',
            'updatedAt',
            'title',
            'priority',
            'amount',
        ];
        const orderByField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
        const orderByDir = sortDir === 'asc' ? 'asc' : 'desc';

        const [notes, allWorkspaceNotes] = await Promise.all([
            prisma.note.findMany({
                where,
                include: NOTE_INCLUDE,
                // Pinned notes are always ordered first, followed by requested sort and tiebreaker
                orderBy: [
                    { isPinned: 'desc' },
                    { [orderByField]: orderByDir },
                    { id: 'asc' },
                ],
            }),
            prisma.note.findMany({
                where: { workspaceId: access.workspaceId },
                select: {
                    id: true,
                    isCompleted: true,
                    amount: true,
                    deletedAt: true,
                },
            }),
        ]);

        const activeNotes = allWorkspaceNotes.filter((n) => n.deletedAt === null);
        const archivedNotes = allWorkspaceNotes.filter((n) => n.deletedAt !== null);

        const summary = {
            total: activeNotes.length,
            completed: activeNotes.filter((n) => n.isCompleted).length,
            pending: activeNotes.filter((n) => !n.isCompleted).length,
            archived: archivedNotes.length,
            totalAmount:
                Math.round(activeNotes.reduce((sum, n) => sum + (n.amount ?? 0), 0) * 100) / 100,
        };

        return NextResponse.json({ notes, summary });
    } catch (error) {
        console.error('Failed to fetch notes:', error);
        return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const queryWorkspaceId = searchParams.get('workspaceId') || undefined;
        let targetWorkspaceId = req.headers.get('x-workspace-id') || queryWorkspaceId;

        if (!targetWorkspaceId) {
            const userId = await requireUserId();
            if (!userId) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            const userWorkspace = await prisma.workspaceAccess.findFirst({
                where: { userId, workspace: { isActive: true } },
                select: { workspaceId: true },
                orderBy: { createdAt: 'asc' },
            });
            if (userWorkspace) {
                targetWorkspaceId = userWorkspace.workspaceId;
            }
        }

        const access = await requireWorkspaceAccess(req, 'MEMBER', targetWorkspaceId ?? undefined);
        if (!access.ok) return access.response;

        let body: unknown;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }

        const validation = validateCreateNote(body);
        if (!validation.ok) {
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        const note = await prisma.note.create({
            data: {
                workspaceId: access.workspaceId,
                userId: access.userId,
                title: validation.data.title,
                content: validation.data.content,
                category: validation.data.category,
                priority: validation.data.priority,
                amount: validation.data.amount,
                isPinned: validation.data.isPinned,
            },
            include: NOTE_INCLUDE,
        });

        return NextResponse.json({ note }, { status: 201 });
    } catch (error) {
        console.error('Failed to create note:', error);
        return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
    }
}
