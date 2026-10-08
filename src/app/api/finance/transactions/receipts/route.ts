import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireWorkspaceAction } from '@/lib/auth/workspaces';
import { RECEIPT_METADATA_SELECT } from '@/features/finance/lib/receipt-validation';

export async function GET(req: Request) {
    try {
        const access = await requireWorkspaceAction(req, 'receipt.view');
        if (!access.ok) return access.response;
        const { workspaceId } = access;

        const raw = new URL(req.url).searchParams.get('ids') ?? '';
        const ids = [...new Set(raw.split(',').map((s) => s.trim()).filter(Boolean))];
        if (ids.length === 0) return NextResponse.json({});
        if (ids.length > 200) {
            return NextResponse.json({ error: 'Too many ids (max 200)' }, { status: 400 });
        }

        const rows = await prisma.receipt.findMany({
            where: { workspaceId, transactionId: { in: ids } },
            select: RECEIPT_METADATA_SELECT,
        });

        return NextResponse.json(Object.fromEntries(rows.map((r) => [r.transactionId, r])));
    } catch (error) {
        console.error('Failed to list receipts:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}