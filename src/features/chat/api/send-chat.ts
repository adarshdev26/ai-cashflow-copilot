import { apiFetch, withWorkspace } from '@/lib/api-client';
import type { ChatRequest, ChatResponse } from '../types';

export function sendChatMessage(workspaceId: string, body: ChatRequest) {
    return apiFetch<ChatResponse>(
        '/api/ai/chat',
        withWorkspace(workspaceId, {
            method: 'POST',
            body: JSON.stringify(body),
        }),
    );
}
