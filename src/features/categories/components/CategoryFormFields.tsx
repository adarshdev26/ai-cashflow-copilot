'use client';

import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { CATEGORY_COLORS } from '../constants';
import type { CategoryKind } from '../types';

type Props = {
    name: string;
    nameError?: string | null;
    color: string;
    kind: CategoryKind;
    onNameChange: (value: string) => void;
    onColorChange: (value: string) => void;
    onKindChange: (value: CategoryKind) => void;
    onSubmit: () => void;
};

export function CategoryFormFields({
    name,
    nameError,
    color,
    kind,
    onNameChange,
    onColorChange,
    onKindChange,
    onSubmit,
}: Props) {
    return (
        <div className="space-y-4">
            <div className="space-y-1">
                <label className="text-base-content/80 text-sm font-medium" htmlFor="category-name">
                    Name
                </label>
                <Input
                    id="category-name"
                    value={name}
                    maxLength={40}
                    placeholder="e.g. Gym"
                    autoFocus
                    aria-invalid={!!nameError}
                    onChange={(e) => onNameChange(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') onSubmit();
                    }}
                />
                {nameError && <p className="text-error mt-1 text-xs">{nameError}</p>}
            </div>

            <div className="space-y-1">
                <label className="text-base-content/80 text-sm font-medium" htmlFor="category-kind">
                    Used for
                </label>
                <Select
                    id="category-kind"
                    value={kind}
                    onChange={(e) => onKindChange(e.target.value as CategoryKind)}
                >
                    <option value="BOTH">Income and expenses</option>
                    <option value="DEBIT">Expenses only</option>
                    <option value="CREDIT">Income only</option>
                </Select>
            </div>

            <div className="space-y-2">
                <p className="text-base-content/80 text-sm font-medium">Color</p>
                <div className="flex flex-wrap gap-2">
                    {CATEGORY_COLORS.map((candidate) => (
                        <button
                            key={candidate}
                            type="button"
                            aria-label={`Color ${candidate}`}
                            aria-pressed={color === candidate}
                            onClick={() => onColorChange(candidate)}
                            className={`h-7 w-7 rounded-full border-2 ${color === candidate ? 'border-slate-900' : 'border-transparent'}`}
                            style={{ backgroundColor: candidate }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
