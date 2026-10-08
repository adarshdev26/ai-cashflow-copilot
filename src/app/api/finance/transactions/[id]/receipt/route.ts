import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireWorkspaceAction } from '@/lib/auth/workspaces';
import { enforceWorkspaceFeature } from '@/lib/plans/server';
import { getSystemBool, getSystemNumber } from '@/lib/settings/server';
import { logAudit, userActor } from '@/lib/admin/audit';
import { AUDIT_ACTIONS, AUDIT_RESOURCE_TYPES } from '@/lib/admin/audit-events';
import {
    deleteReceiptAsset,
    uploadReceiptAsset,
    type ReceiptResourceType,
} from '@/lib/cloudinary';
import {
    RECEIPT_METADATA_SELECT,
    isAllowedReceiptMime,
    matchesMagicBytes,
    normalizeReceiptNote,
    sanitizeFileName,
} from '@/features/finance/lib/receipt-validation';

export const runtime = 'nodejs'; // the cloudinary SDK needs Node APIs

type Ctx = { params: Promise<{ id: string }> };

const BASE64_RE = /^[A-Za-z0-9+/]*={0,2}$/;

export async function POST(req: Request, { params }: Ctx) {
    try {
        const access = await requireWorkspaceAction(req, 'receipt.upload');
        if (!access.ok) return access.response;
        const { workspaceId } = access;
        const { id } = await params;

        const blocked = await enforceWorkspaceFeature(workspaceId, 'receipts', access.userId);
        if (blocked) return blocked;

        const tx = await prisma.transaction.findFirst({
            where: { id, workspaceId },
            select: { id: true },
        });
        if (!tx) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const body = await req.json().catch(() => null);
        const fileName = typeof body?.fileName === 'string' ? sanitizeFileName(body.fileName) : '';
        const mimeType = body?.mimeType;
        const declaredSize = body?.size;
        const b64 = typeof body?.data === 'string' ? body.data : '';

        if (!fileName || !b64) {
            return NextResponse.json({ error: 'fileName and data are required' }, { status: 400 });
        }
        if (!isAllowedReceiptMime(mimeType)) {
            return NextResponse.json(
                { error: 'Only JPEG, PNG, WebP or PDF files are allowed' },
                { status: 400 },
            );
        }
        const note = normalizeReceiptNote(body?.note);
        if (!note.ok) return NextResponse.json({ error: note.error }, { status: 400 });

        const maxBytes = await getSystemNumber('limits.receiptMaxBytes');
        if (b64.length > Math.ceil((maxBytes * 4) / 3) + 4) {
            return NextResponse.json({ error: 'File is too large' }, { status: 413 });
        }
        if (!BASE64_RE.test(b64)) {
            return NextResponse.json({ error: 'Invalid file data' }, { status: 400 });
        }

        const buffer = Buffer.from(b64, 'base64');
        if (buffer.byteLength === 0) {
            return NextResponse.json({ error: 'File is empty' }, { status: 400 });
        }
        if (buffer.byteLength > maxBytes) {
            return NextResponse.json({ error: 'File is too large' }, { status: 413 });
        }
        if (declaredSize !== buffer.byteLength) {
            return NextResponse.json({ error: 'File size mismatch' }, { status: 400 });
        }
        if (!matchesMagicBytes(mimeType, buffer)) {
            return NextResponse.json(
                { error: 'File contents do not match its type' },
                { status: 400 },
            );
        }

        const existing = await prisma.receipt.findUnique({
            where: { transactionId: id },
            select: { id: true, publicId: true, resourceType: true },
        });

        // 1) upload to Cloudinary
        const asset = await uploadReceiptAsset({
            buffer,
            workspaceId,
            transactionId: id,
            mimeType,
        });

        // 2) save the reference; if the DB write fails, remove the new asset
        let receipt;
        try {
            receipt = await prisma.receipt.upsert({
                where: { transactionId: id },
                create: {
                    transactionId: id,
                    workspaceId,
                    fileName,
                    mimeType,
                    size: buffer.byteLength,
                    publicId: asset.publicId,
                    resourceType: asset.resourceType,
                    note: note.value,
                },
                update: {
                    fileName,
                    mimeType,
                    size: buffer.byteLength,
                    publicId: asset.publicId,
                    resourceType: asset.resourceType,
                    note: note.value,
                },
                select: RECEIPT_METADATA_SELECT,
            });
        } catch (dbError) {
            await deleteReceiptAsset(asset.publicId, asset.resourceType);
            throw dbError;
        }

        // 3) on replace, remove the old file
        if (existing) {
            await deleteReceiptAsset(existing.publicId, existing.resourceType as ReceiptResourceType);
        }

        await logAudit({
            actor: await userActor(access.userId),
            action: AUDIT_ACTIONS.RECEIPT_UPLOADED,
            resourceType: AUDIT_RESOURCE_TYPES.RECEIPT,
            resourceId: receipt.id,
            workspaceId,
            metadata: {
                transactionId: id,
                fileName,
                mimeType,
                size: receipt.size,
                replaced: Boolean(existing),
            },
        });

        return NextResponse.json(receipt, { status: 201 });
    } catch (error) {
        console.error('Failed to upload receipt:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: Ctx) {
    try {
        const access = await requireWorkspaceAction(req, 'receipt.upload');
        if (!access.ok) return access.response;
        const { workspaceId } = access;
        const { id } = await params;

        const body = await req.json().catch(() => null);
        const note = normalizeReceiptNote(body?.note);
        if (!note.ok) return NextResponse.json({ error: note.error }, { status: 400 });

        const existing = await prisma.receipt.findFirst({
            where: { transactionId: id, workspaceId },
            select: { id: true, note: true },
        });
        if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const receipt = await prisma.receipt.update({
            where: { id: existing.id },
            data: { note: note.value },
            select: RECEIPT_METADATA_SELECT,
        });

        await logAudit({
            actor: await userActor(access.userId),
            action: AUDIT_ACTIONS.RECEIPT_UPDATED,
            resourceType: AUDIT_RESOURCE_TYPES.RECEIPT,
            resourceId: receipt.id,
            workspaceId,
            metadata: {
                transactionId: id,
                changes: { note: { before: existing.note, after: receipt.note } },
            },
        });

        return NextResponse.json(receipt, { status: 200 });
    } catch (error) {
        console.error('Failed to update receipt:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: Ctx) {
    try {
        const access = await requireWorkspaceAction(req, 'receipt.delete');
        if (!access.ok) return access.response;
        const { workspaceId } = access;
        const { id } = await params;

        const existing = await prisma.receipt.findFirst({
            where: { transactionId: id, workspaceId },
            select: {
                id: true,
                fileName: true,
                mimeType: true,
                size: true,
                publicId: true,
                resourceType: true,
            },
        });
        if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        await prisma.receipt.delete({ where: { id: existing.id } });
        await deleteReceiptAsset(existing.publicId, existing.resourceType as ReceiptResourceType);

        await logAudit({
            actor: await userActor(access.userId),
            action: AUDIT_ACTIONS.RECEIPT_DELETED,
            resourceType: AUDIT_RESOURCE_TYPES.RECEIPT,
            resourceId: existing.id,
            workspaceId,
            metadata: {
                transactionId: id,
                fileName: existing.fileName,
                mimeType: existing.mimeType,
                size: existing.size,
            },
        });

        return NextResponse.json({ id: existing.id }, { status: 200 });
    } catch (error) {
        console.error('Failed to delete receipt:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}