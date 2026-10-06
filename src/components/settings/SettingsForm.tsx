'use client';

import { useState } from 'react';
import { Select } from '@/components/ui/Select';
import { settingsInputCls } from '@/components/ui/inputs';
import type { SettingDef, SettingValue } from '@/lib/settings/registry';
import { validatePatch } from '@/lib/settings/validate';

type Draft = Record<string, SettingValue | ''>;
type Props = {
    defs: readonly SettingDef[];
    /** effective values (defaults + overrides). Remount with a changing `key` after save. */
    values: Record<string, SettingValue>;
    /** patch uses null for "back to default" */
    onSave: (patch: Record<string, SettingValue | null>) => void;
    saving?: boolean;
    readOnly?: boolean;
    onResetAll?: () => void;
};

/** Generic, registry-driven settings form. Mobile first: stacked, 16px inputs, 44px targets. */
export function SettingsForm({ defs, values, onSave, saving, readOnly, onResetAll }: Props) {
    const [draft, setDraft] = useState<Draft>(() => ({ ...values }));
    const [errors, setErrors] = useState<Record<string, string>>({});

    const set = (key: string, v: SettingValue | '') => {
        setDraft((d) => ({ ...d, [key]: v }));
        setErrors((e) => {
            const next = { ...e };
            delete next[key];
            return next;
        });
    };
    const dirtyKeys = defs.filter((d) => draft[d.key] !== values[d.key]).map((d) => d.key);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (readOnly || !dirtyKeys.length) return;
        const raw: Record<string, SettingValue> = {};
        for (const k of dirtyKeys) {
            const v = draft[k];
            raw[k] = (v === '' ? Number.NaN : v) as SettingValue;
        }
        const check = validatePatch(defs[0].scope, raw);
        if (!check.ok) {
            setErrors(check.errors);
            return;
        }
        const patch: Record<string, SettingValue | null> = {};
        for (const k of dirtyKeys) {
            const def = defs.find((d) => d.key === k)!;
            patch[k] = raw[k] === def.default ? null : raw[k];
        }
        onSave(patch);
    };

    return (
        <form onSubmit={submit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
                {defs.map((def) => {
                    const id = `setting-${def.key}`;
                    const value = draft[def.key];
                    const isDefault = value === def.default;
                    return (
                        <div
                            key={def.key}
                            className={def.type === 'boolean' ? 'sm:col-span-2' : ''}
                        >
                            {def.type === 'boolean' ? (
                                <label
                                    htmlFor={id}
                                    className="flex min-h-11 cursor-pointer items-start justify-between gap-4"
                                >
                                    <span className="min-w-0">
                                        <span className="text-base-content block text-sm font-medium">
                                            {def.label}
                                        </span>
                                        <span className="text-base-content/60 block text-xs">
                                            {def.description}
                                        </span>
                                    </span>
                                    <input
                                        id={id}
                                        type="checkbox"
                                        className="toggle toggle-primary mt-0.5 shrink-0"
                                        checked={value === true}
                                        disabled={readOnly || saving}
                                        onChange={(e) => set(def.key, e.target.checked)}
                                    />
                                </label>
                            ) : (
                                <>
                                    <label
                                        htmlFor={id}
                                        className="text-base-content/70 mb-1 block text-sm font-medium"
                                    >
                                        {def.label}
                                    </label>
                                    {def.type === 'enum' ? (
                                        <Select
                                            id={id}
                                            value={String(value)}
                                            disabled={readOnly || saving}
                                            onChange={(e) =>
                                                set(
                                                    def.key,
                                                    def.options.find(
                                                        (o) => String(o.value) === e.target.value,
                                                    )!.value,
                                                )
                                            }
                                        >
                                            {def.options.map((o) => (
                                                <option
                                                    key={String(o.value)}
                                                    value={String(o.value)}
                                                >
                                                    {o.label}
                                                </option>
                                            ))}
                                        </Select>
                                    ) : def.type === 'number' ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                id={id}
                                                type="number"
                                                inputMode="numeric"
                                                min={def.min}
                                                max={def.max}
                                                step={1}
                                                value={value as number | ''}
                                                disabled={readOnly || saving}
                                                onChange={(e) =>
                                                    set(
                                                        def.key,
                                                        e.target.value === ''
                                                            ? ''
                                                            : Number(e.target.value),
                                                    )
                                                }
                                                className={settingsInputCls}
                                            />
                                            {def.unit && (
                                                <span className="text-base-content/50 shrink-0 text-xs">
                                                    {def.unit}
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <input
                                            id={id}
                                            type={def.format === 'email' ? 'email' : 'text'}
                                            maxLength={def.maxLength}
                                            value={value as string}
                                            disabled={readOnly || saving}
                                            onChange={(e) => set(def.key, e.target.value)}
                                            className={settingsInputCls}
                                        />
                                    )}
                                    <p className="text-base-content/50 mt-1 text-xs">
                                        {def.description}
                                        {def.type === 'number' && ` (${def.min}–${def.max})`}
                                    </p>
                                </>
                            )}
                            {errors[def.key] && (
                                <p role="alert" className="text-error mt-1 text-xs">
                                    {errors[def.key]}
                                </p>
                            )}
                            {!readOnly && !isDefault && (
                                <button
                                    type="button"
                                    onClick={() => set(def.key, def.default)}
                                    className="text-primary mt-1 min-h-11 text-xs hover:underline sm:min-h-0"
                                >
                                    Reset to default
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {!readOnly && (
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    {onResetAll && (
                        <button
                            type="button"
                            onClick={onResetAll}
                            disabled={saving}
                            className="btn btn-ghost sm:btn-sm min-h-11 sm:min-h-0"
                        >
                            Reset all to defaults
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={saving || !dirtyKeys.length}
                        className="btn btn-primary sm:btn-sm min-h-11 sm:min-h-0"
                    >
                        {saving ? 'Saving...' : 'Save changes'}
                    </button>
                </div>
            )}
        </form>
    );
}
