import { NextResponse } from 'next/server';
import { requireWorkspaceAccess } from '@/lib/auth/workspaces';
import { captureRouteError } from '@/lib/admin/errors';
import { GeminiConfigError } from '@/lib/gemini';
import { generateChatReply } from '@/features/chat/lib/generate-reply';
import { parseChatRequest } from '@/features/chat/lib/parse-chat';
import { getChatContext } from '@/features/chat/lib/workspace-context';
import type { ChatResponse } from '@/features/chat/types';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    let workspaceId: string | undefined;
    let userId: string | undefined;

    try {
        const access = await requireWorkspaceAccess(req, 'VIEWER');
        if (!access.ok) return access.response;
        ({ workspaceId, userId } = access);

        const body = await req.json().catch(() => null);
        const parsed = parseChatRequest(body);
        if ('error' in parsed) {
            return NextResponse.json({ error: parsed.error }, { status: 400 });
        }

        const context = await getChatContext(workspaceId);
        const reply = await generateChatReply(parsed, context);
        const response: ChatResponse = {
            reply,
            generatedAt: new Date().toISOString(),
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('AI chat failed:', error instanceof Error ? error.message : error);
        await captureRouteError(req, error, { status: 502, workspaceId, userId });
        const status = error instanceof GeminiConfigError ? 503 : 502;
        return NextResponse.json(
            { error: 'The financial assistant is unavailable right now' },
            { status },
        );
    }
}
