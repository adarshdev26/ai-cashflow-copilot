import 'server-only';
import { NextResponse } from 'next/server';
import { getSystemBool, getWorkspaceSettings } from '@/lib/settings/server';

export async function isAiAssistantEnabled(workspaceId: string): Promise<boolean> {
    const [adminOn, workspace] = await Promise.all([
        getSystemBool('features.aiAssistantEnabled'),
        getWorkspaceSettings(workspaceId),
    ]);
    return adminOn && workspace.enableAiAssistant !== false;
}

/** 403 before Gemini or Redis. Null means the assistant is enabled. */
export async function aiAssistantDisabledResponse(
    workspaceId: string,
): Promise<NextResponse | null> {
    if (await isAiAssistantEnabled(workspaceId)) return null;
    return NextResponse.json(
        {
            error: 'AI Assistant is disabled for this workspace.',
            code: 'ADMIN_FEATURE',
            key: 'enableAiAssistant',
        },
        { status: 403 },
    );
}
