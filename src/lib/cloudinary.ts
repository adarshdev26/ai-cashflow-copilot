import 'server-only';
import { randomUUID } from 'crypto';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';

export type ReceiptResourceType = 'image' | 'raw';

let configured = false;
function client() {
    if (!configured) {
        const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
        const api_key = process.env.CLOUDINARY_API_KEY;
        const api_secret = process.env.CLOUDINARY_API_SECRET;
        if (!cloud_name || !api_key || !api_secret) {
            throw new Error(
                'Cloudinary env vars are missing (CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET)',
            );
        }
        cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
        configured = true;
    }
    return cloudinary;
}

/** PDFs go in as 'raw' so they don't hit Cloudinary's restricted-PDF-delivery setting. */
export const receiptResourceType = (mimeType: string): ReceiptResourceType =>
    mimeType === 'application/pdf' ? 'raw' : 'image';

export async function uploadReceiptAsset(opts: {
    buffer: Buffer;
    workspaceId: string;
    transactionId: string;
    mimeType: string;
}): Promise<{ publicId: string; resourceType: ReceiptResourceType }> {
    const { buffer, workspaceId, transactionId, mimeType } = opts;
    const resourceType = receiptResourceType(mimeType);
    // Unique id per upload: a replace never serves a stale CDN copy. Raw ids keep their extension.
    const ext = resourceType === 'raw' ? '.pdf' : '';
    const publicId = `receipts/${workspaceId}/${transactionId}-${randomUUID()}${ext}`;

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        const stream = client().uploader.upload_stream(
            {
                public_id: publicId,
                resource_type: resourceType,
                type: 'authenticated', // no public URL
                overwrite: false,
            },
            (err, res) => (err || !res ? reject(err ?? new Error('Upload failed')) : resolve(res)),
        );
        stream.end(buffer);
    });

    return { publicId: result.public_id, resourceType };
}

/** Best-effort: never throws, so a Cloudinary hiccup can't break the main action. */
export async function deleteReceiptAsset(
    publicId: string,
    resourceType: ReceiptResourceType,
): Promise<void> {
    try {
        await client().uploader.destroy(publicId, {
            resource_type: resourceType,
            type: 'authenticated',
            invalidate: true,
        });
    } catch (err) {
        console.error(
            '[cloudinary] delete failed:',
            publicId,
            err instanceof Error ? err.message : 'unknown error',
        );
    }
}

/** Signed delivery URL. Used only server-side; never sent to the browser. */
export function getReceiptSignedUrl(publicId: string, resourceType: ReceiptResourceType): string {
    return client().url(publicId, {
        resource_type: resourceType,
        type: 'authenticated',
        sign_url: true,
        secure: true,
    });
}
