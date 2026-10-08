import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireWorkspaceAction } from '@/lib/auth/workspaces';
import { getReceiptSignedUrl, type ReceiptResourceType } from '@/lib/cloudinary';

export const runtime = 'nodejs';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const access = await requireWorkspaceAction(req, 'receipt.view');
        if (!access.ok) return access.response;
        const { workspaceId } = access;
        const { id } = await params;

        const receipt = await prisma.receipt.findFirst({
            where: { transactionId: id, workspaceId },
            select: { publicId: true, resourceType: true, mimeType: true, fileName: true },
        });
        if (!receipt) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        // Access is already verified above; now fetch from Cloudinary with a signed URL.
        const upstream = await fetch(
            getReceiptSignedUrl(receipt.publicId, receipt.resourceType as ReceiptResourceType),
            { cache: 'no-store' },
        );
        if (!upstream.ok || !upstream.body) {
            console.error('Cloudinary fetch failed:', upstream.status);
            return NextResponse.json({ error: 'Could not load receipt' }, { status: 502 });
        }

        const download = new URL(req.url).searchParams.get('download') === '1';
        const ascii = receipt.fileName.replace(/[^\w.\- ]/g, '_');
        const disposition = `${download ? 'attachment' : 'inline'}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(receipt.fileName)}`;

        return new NextResponse(upstream.body, {
            status: 200,
            headers: {
                'Content-Type': receipt.mimeType, // allowlisted + magic-byte checked at upload
                'Content-Disposition': disposition,
                'X-Content-Type-Options': 'nosniff',
                'Content-Security-Policy': "sandbox; default-src 'none'",
                'Cache-Control': 'private, no-store',
            },
        });
    } catch (error) {
        console.error('Failed to read receipt file:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
