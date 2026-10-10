'use client';

import { FormEvent, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useAiAssistantEnabled } from '@/features/settings/hooks/use-ai-assistant';
import { useActiveWorkspaceId } from '@/features/workspaces';
import { useFinancialChat } from '../hooks/use-financial-chat';
import type { ChatTurn } from '../types';

const MAX_MESSAGE = 1000;

export function FinancialChat() {
    const aiEnabled = useAiAssistantEnabled();
    const workspaceId = useActiveWorkspaceId();
    const chat = useFinancialChat(workspaceId);
    const [draft, setDraft] = useState('');
    const [turns, setTurns] = useState<ChatTurn[]>([]);

    const pending = chat.isPending;
    const trimmed = draft.trim();

    if (!aiEnabled) return null;

    const onSubmit = (event: FormEvent) => {
        event.preventDefault();
        if (!trimmed || pending || !workspaceId) return;

        const history = turns.slice(-8);
        const message = trimmed.slice(0, MAX_MESSAGE);
        setDraft('');
        setTurns((current) => [...current, { role: 'user', content: message }]);

        chat.mutate(
            { message, history },
            {
                onSuccess: (data) => {
                    setTurns((current) => [...current, { role: 'assistant', content: data.reply }]);
                },
                onError: (error) => {
                    console.error(error);
                },
            },
        );
    };

    return (
        <section
            aria-label="Financial assistant"
            className="border-base-300 bg-base-100 flex min-h-[32rem] flex-col rounded-xl border shadow-sm"
        >
            <div className="border-base-300 flex items-center justify-between gap-3 border-b px-5 py-4">
                <h1 className="text-base-content flex items-center gap-2 text-lg font-semibold">
                    <Sparkles className="text-primary h-4 w-4" />
                    Financial assistant
                </h1>
                <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-medium">
                    AI-generated
                </span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                {turns.length === 0 ? (
                    <p className="text-base-content/60 text-sm">
                        Ask about this month&apos;s income, spending, budgets, or goals. Answers use
                        your workspace data.
                    </p>
                ) : (
                    turns.map((turn, index) => (
                        <div
                            key={`${turn.role}-${index}`}
                            className={
                                turn.role === 'user'
                                    ? 'bg-primary/10 text-base-content ml-8 rounded-lg px-3 py-2 text-sm'
                                    : 'bg-base-200 text-base-content mr-8 rounded-lg px-3 py-2 text-sm'
                            }
                        >
                            {turn.content}
                        </div>
                    ))
                )}
                {pending ? (
                    <div className="bg-base-200 mr-8 h-10 animate-pulse rounded-lg" aria-busy="true" />
                ) : null}
                {chat.isError ? (
                    <p className="text-error text-sm">
                        Couldn&apos;t get a reply right now. Try again.
                    </p>
                ) : null}
            </div>

            <form onSubmit={onSubmit} className="border-base-300 flex gap-2 border-t p-4">
                <label htmlFor="financial-chat-input" className="sr-only">
                    Message
                </label>
                <input
                    id="financial-chat-input"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    maxLength={MAX_MESSAGE}
                    disabled={pending || !workspaceId}
                    placeholder="Ask about your cash flow"
                    className="border-base-300 bg-base-100 text-base-content placeholder:text-base-content/40 focus:border-primary flex-1 rounded-lg border px-3 py-2 text-sm outline-none"
                />
                <button
                    type="submit"
                    disabled={pending || !trimmed || !workspaceId}
                    className="bg-primary text-primary-content rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-40"
                >
                    Send
                </button>
            </form>
        </section>
    );
}
