import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireWorkspaceAccess } from '@/lib/auth/workspaces';
import { validateUpdateNote } from '@/features/notes/lib/validate-note';

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

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const note = await prisma.note.findUnique({
            where: { id },
            include: NOTE_INCLUDE,
        });

        if (!note) {
            return NextResponse.json({ error: 'Note not found' }, { status: 404 });
        }

        const access = await requireWorkspaceAccess(req, 'VIEWER', note.workspaceId);
        if (!access.ok) return access.response;

        return NextResponse.json({ note });
    } catch (error) {
        console.error('Failed to retrieve note:', error);
        return NextResponse.json({ error: 'Failed to retrieve note' }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

        let body: unknown;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }

        const validation = validateUpdateNote(body);
        if (!validation.ok) {
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        const updated = await prisma.note.update({
            where: { id },
            data: validation.data,
            include: NOTE_INCLUDE,
        });

        return NextResponse.json({ note: updated });
    } catch (error) {
        console.error('Failed to update note:', error);
        return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
            where: { id },
            data: {
                deletedAt: new Date(),
            },
        });

        return NextResponse.json({ success: true, id: updated.id, deletedAt: updated.deletedAt });
    } catch (error) {
        console.error('Failed to delete note:', error);
        return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
    }
}
