'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { notify, getErrorMessage } from '@/lib/ui/toast';
import { useCreateNote, useUpdateNote } from '../hooks/use-notes';
import type { Note, NoteCategory, NotePriority } from '../types';
import {
    NOTE_CATEGORIES,
    NOTE_PRIORITIES,
    MAX_NOTE_TITLE_LENGTH,
    MAX_NOTE_CONTENT_LENGTH,
} from '../lib/validate-note';

interface NoteFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingNote?: Note | null;
    currency?: string;
}

interface FormErrors {
    title?: string;
    content?: string;
    amount?: string;
    general?: string;
}

function NoteFormInner({
    editingNote,
    currency,
    onClose,
}: {
    editingNote?: Note | null;
    currency: string;
    onClose: () => void;
}) {
    const isEditing = Boolean(editingNote);

    const [title, setTitle] = useState(editingNote?.title ?? '');
    const [content, setContent] = useState(editingNote?.content ?? '');
    const [category, setCategory] = useState<NoteCategory>(editingNote?.category ?? 'GENERAL');
    const [priority, setPriority] = useState<NotePriority>(editingNote?.priority ?? 'MEDIUM');
    const [amount, setAmount] = useState<string>(
        editingNote?.amount != null ? String(editingNote.amount) : '',
    );
    const [isPinned, setIsPinned] = useState<boolean>(editingNote?.isPinned ?? false);
    const [errors, setErrors] = useState<FormErrors>({});

    const createNote = useCreateNote();
    const updateNote = useUpdateNote();
    const isSubmitting = createNote.isPending || updateNote.isPending;

    const validate = (): boolean => {
        const nextErrors: FormErrors = {};

        const trimmedTitle = title.trim();
        if (!trimmedTitle) {
            nextErrors.title = 'Title is required';
        } else if (trimmedTitle.length > MAX_NOTE_TITLE_LENGTH) {
            nextErrors.title = `Title must be at most ${MAX_NOTE_TITLE_LENGTH} characters`;
        }

        const trimmedContent = content.trim();
        if (!trimmedContent) {
            nextErrors.content = 'Content is required';
        } else if (trimmedContent.length > MAX_NOTE_CONTENT_LENGTH) {
            nextErrors.content = `Content must be at most ${MAX_NOTE_CONTENT_LENGTH} characters`;
        }

        if (amount.trim() !== '') {
            const parsed = Number(amount);
            if (!Number.isFinite(parsed)) {
                nextErrors.amount = 'Amount must be a valid number';
            } else if (parsed < 0) {
                nextErrors.amount = 'Amount cannot be negative';
            }
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (!validate()) return;

        const parsedAmount = amount.trim() !== '' ? Math.round(Number(amount) * 100) / 100 : null;

        try {
            if (isEditing && editingNote) {
                await updateNote.mutateAsync({
                    id: editingNote.id,
                    title: title.trim(),
                    content: content.trim(),
                    category,
                    priority,
                    amount: parsedAmount,
                    isPinned,
                });
                notify.success('Note updated successfully');
            } else {
                await createNote.mutateAsync({
                    title: title.trim(),
                    content: content.trim(),
                    category,
                    priority,
                    amount: parsedAmount,
                    isPinned,
                });
                notify.success('Note created successfully');
            }
            onClose();
        } catch (error) {
            console.error('Failed to save note:', error);
            const msg = getErrorMessage(error, 'Failed to save note');
            setErrors((prev) => ({ ...prev, general: msg }));
            notify.error(msg);
        }
    };

    return (
        <form id="note-form" onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
                <div className="border-error/30 bg-error/10 text-error rounded-lg border p-3 text-sm">
                    {errors.general}
                </div>
            )}

            {/* Title */}
            <div>
                <label htmlFor="note-title" className="text-base-content block text-sm font-medium">
                    Title <span className="text-error">*</span>
                </label>
                <Input
                    id="note-title"
                    type="text"
                    placeholder="e.g. Q3 Tax Filing Deadline or Review Insurance"
                    value={title}
                    onChange={(e) => {
                        setTitle(e.target.value);
                        if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
                    }}
                    disabled={isSubmitting}
                    className={errors.title ? 'border-error focus:border-error' : ''}
                    required
                />
                {errors.title && <p className="text-error mt-1 text-xs">{errors.title}</p>}
            </div>

            {/* Content */}
            <div>
                <label
                    htmlFor="note-content"
                    className="text-base-content block text-sm font-medium"
                >
                    Content / Details <span className="text-error">*</span>
                </label>
                <textarea
                    id="note-content"
                    rows={4}
                    placeholder="Add reminders, notes, action items, or financial context..."
                    value={content}
                    onChange={(e) => {
                        setContent(e.target.value);
                        if (errors.content) setErrors((prev) => ({ ...prev, content: undefined }));
                    }}
                    disabled={isSubmitting}
                    className={`border-base-300 focus:ring-primary/20 focus:border-primary w-full rounded-lg border px-3 py-2 text-base focus:ring-2 focus:outline-none sm:text-sm ${
                        errors.content ? 'border-error focus:border-error' : ''
                    }`}
                    required
                />
                {errors.content && <p className="text-error mt-1 text-xs">{errors.content}</p>}
            </div>

            {/* Category & Priority Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label
                        htmlFor="note-category"
                        className="text-base-content block text-sm font-medium"
                    >
                        Category
                    </label>
                    <Select
                        id="note-category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value as NoteCategory)}
                        disabled={isSubmitting}
                        className="w-full"
                    >
                        {NOTE_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                                {cat.charAt(0) + cat.slice(1).toLowerCase()}
                            </option>
                        ))}
                    </Select>
                </div>

                <div>
                    <label
                        htmlFor="note-priority"
                        className="text-base-content block text-sm font-medium"
                    >
                        Priority
                    </label>
                    <Select
                        id="note-priority"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as NotePriority)}
                        disabled={isSubmitting}
                        className="w-full"
                    >
                        {NOTE_PRIORITIES.map((p) => (
                            <option key={p} value={p}>
                                {p.charAt(0) + p.slice(1).toLowerCase()}
                            </option>
                        ))}
                    </Select>
                </div>
            </div>

            {/* Optional Amount */}
            <div>
                <label
                    htmlFor="note-amount"
                    className="text-base-content block text-sm font-medium"
                >
                    Related Amount ({currency}){' '}
                    <span className="text-base-content/50 font-normal">(Optional)</span>
                </label>
                <Input
                    id="note-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => {
                        setAmount(e.target.value);
                        if (errors.amount) setErrors((prev) => ({ ...prev, amount: undefined }));
                    }}
                    disabled={isSubmitting}
                    className={errors.amount ? 'border-error focus:border-error' : ''}
                />
                {errors.amount && <p className="text-error mt-1 text-xs">{errors.amount}</p>}
            </div>

            {/* Pin Note Option */}
            <div className="flex items-center gap-2.5 pt-1">
                <input
                    type="checkbox"
                    id="note-pinned"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    disabled={isSubmitting}
                    className="h-4 w-4 rounded border-base-300 text-primary focus:ring-primary/20"
                />
                <label
                    htmlFor="note-pinned"
                    className="text-base-content/80 text-sm font-medium cursor-pointer select-none"
                >
                    Pin note to top of dashboard
                </label>
            </div>

            <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
                    Cancel
                </Button>
                <Button type="submit" variant="primary" loading={isSubmitting}>
                    {isEditing ? 'Save Changes' : 'Create Note'}
                </Button>
            </div>
        </form>
    );
}

export function NoteFormModal({
    isOpen,
    onClose,
    editingNote,
    currency = 'INR',
}: NoteFormModalProps) {
    if (!isOpen) return null;

    const isEditing = Boolean(editingNote);

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            title={isEditing ? 'Edit Financial Note' : 'Add Financial Note'}
            description={
                isEditing
                    ? 'Update the details of your financial note or reminder.'
                    : 'Create a new reminder, budget note, or financial task.'
            }
            size="lg"
        >
            <NoteFormInner
                key={editingNote?.id ?? 'create'}
                editingNote={editingNote}
                currency={currency}
                onClose={onClose}
            />
        </Modal>
    );
}
