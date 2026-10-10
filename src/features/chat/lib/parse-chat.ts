import type { ChatRequest, ChatRole, ChatTurn } from '../types';
import { cleanText } from './text';

const MAX_MESSAGE = 1000;
const MAX_HISTORY = 8;

function isRole(value: unknown): value is ChatRole {
    return value === 'user' || value === 'assistant';
}

export function parseChatRequest(body: unknown): ChatRequest | { error: string } {
    if (typeof body !== 'object' || body === null) {
        return { error: 'Invalid request body' };
    }

    const record = body as Record<string, unknown>;
    const message = cleanText(typeof record.message === 'string' ? record.message : '', MAX_MESSAGE);
    if (!message) return { error: 'A message is required' };

    const history: ChatTurn[] = [];
    if (record.history !== undefined) {
        if (!Array.isArray(record.history)) return { error: 'Invalid history' };
        const recent = record.history.slice(-MAX_HISTORY);
        for (const item of recent) {
            if (typeof item !== 'object' || item === null) return { error: 'Invalid history' };
            const turn = item as Record<string, unknown>;
            if (!isRole(turn.role) || typeof turn.content !== 'string') {
                return { error: 'Invalid history' };
            }
            const content = cleanText(turn.content, MAX_MESSAGE);
            if (!content) continue;
            history.push({ role: turn.role, content });
        }
    }

    return { message, history };
}
