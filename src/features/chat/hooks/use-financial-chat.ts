import { useMutation } from '@tanstack/react-query';
import { sendChatMessage } from '../api/send-chat';
import type { ChatRequest, ChatResponse } from '../types';

export function useFinancialChat(workspaceId: string) {
    return useMutation<ChatResponse, Error, ChatRequest>({
        mutationFn: (body) => sendChatMessage(workspaceId, body),
    });
}
