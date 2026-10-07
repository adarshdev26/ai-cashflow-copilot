import { SETTINGS_BY_KEY, type SettingDef, type SettingScope, type SettingValue } from './registry';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Returns an error message, or null when valid. Pure: safe on client and server. */
export function checkValue(def: SettingDef, value: unknown): string | null {
    switch (def.type) {
        case 'number':
            if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value))
                return 'Enter a whole number';
            if (value < def.min || value > def.max)
                return `Must be between ${def.min} and ${def.max}`;
            return null;
        case 'boolean':
            return typeof value === 'boolean' ? null : 'Must be on or off';
        case 'string': {
            if (typeof value !== 'string') return 'Must be text';
            const v = value.trim();
            if (v.length < (def.minLength ?? 0)) return `At least ${def.minLength} characters`;
            if (v.length > def.maxLength) return `At most ${def.maxLength} characters`;
            if (def.format === 'email' && !EMAIL_RE.test(v)) return 'Enter a valid email';
            return null;
        }
        case 'enum':
            return def.options.some((o) => o.value === value)
                ? null
                : 'Choose one of the listed options';
    }
}

export const isValid = (def: SettingDef, value: unknown) => checkValue(def, value) === null;

export type PatchResult =
    | { ok: true; set: Record<string, SettingValue>; reset: string[] }
    | { ok: false; errors: Record<string, string> };

/** patch: { key: value }. A value of null resets that key to its default. */
export function validatePatch(scope: SettingScope, patch: unknown): PatchResult {
    if (typeof patch !== 'object' || patch === null || Array.isArray(patch)) {
        return { ok: false, errors: { _: 'Invalid request body' } };
    }
    const errors: Record<string, string> = {};
    const set: Record<string, SettingValue> = {};
    const reset: string[] = [];

    for (const [key, raw] of Object.entries(patch)) {
        const def = SETTINGS_BY_KEY[key];
        if (!def || def.scope !== scope) {
            errors[key] = 'Unknown setting';
            continue;
        }
        if (raw === null) {
            reset.push(key);
            continue;
        }
        const value = def.type === 'string' && typeof raw === 'string' ? raw.trim() : raw;
        const err = checkValue(def, value);
        if (err) errors[key] = err;
        else set[key] = value as SettingValue;
    }
    if (Object.keys(errors).length) return { ok: false, errors };
    return { ok: true, set, reset };
}
