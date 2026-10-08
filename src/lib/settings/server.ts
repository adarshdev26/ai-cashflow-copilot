import { cache } from 'react';
import { prisma } from '@/lib/db/prisma';
import type { Prisma } from '@/generated/prisma';
import {
    SETTINGS,
    SETTINGS_BY_KEY,
    defaultsFor,
    type SettingScope,
    type SettingValue,
} from './registry';
import { isValid, validatePatch } from './validate';
import { getWorkspaceOwnerPlan } from '@/lib/plans/server';
import { getPlanConfig } from '@/lib/plans/server';
import { CAPABILITIES, type CapabilityKey } from '@/lib/capabilities';

export type SettingsMap = Record<string, SettingValue>;
const json = (v: unknown) => v as Prisma.InputJsonValue;

/** Registry defaults overlaid with stored overrides. Invalid stored values are ignored. */
function merge(scope: SettingScope, stored: unknown): SettingsMap {
    const out = defaultsFor(scope);
    if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
        for (const [k, v] of Object.entries(stored as Record<string, unknown>)) {
            const def = SETTINGS_BY_KEY[k];
            if (def && def.scope === scope && isValid(def, v)) out[k] = v as SettingValue;
        }
    }
    return out;
}

// ---------------------------------------------------------------- reads
/** One DB read per request. Falls back to defaults if the read fails (auth must never break). */
export const getSystemSettings = cache(async (): Promise<SettingsMap> => {
    try {
        const rows = await prisma.systemSetting.findMany();
        return merge('system', Object.fromEntries(rows.map((r) => [r.key, r.value])));
    } catch (error) {
        console.error('Failed to load system settings, using defaults:', error);
        return defaultsFor('system');
    }
});

export async function getSystemNumber(key: string): Promise<number> {
    const v = (await getSystemSettings())[key];
    return typeof v === 'number' ? v : Number(SETTINGS_BY_KEY[key].default);
}
export async function getSystemBool(key: string): Promise<boolean> {
    const v = (await getSystemSettings())[key];
    return typeof v === 'boolean' ? v : Boolean(SETTINGS_BY_KEY[key].default);
}
export async function getSystemString(key: string): Promise<string> {
    const v = (await getSystemSettings())[key];
    return typeof v === 'string' ? v : String(SETTINGS_BY_KEY[key].default);
}

export async function getPublicSettings(): Promise<SettingsMap> {
    const all = await getSystemSettings();
    return Object.fromEntries(SETTINGS.filter((d) => d.public).map((d) => [d.key, all[d.key]]));
}

export const getUserPreferences = cache(async (userId: string): Promise<SettingsMap> => {
    const row = await prisma.userPreference.findUnique({ where: { userId } });
    return merge('user', row?.values);
});

export const getWorkspaceSettings = cache(async (workspaceId: string): Promise<SettingsMap> => {
    const row = await prisma.workspaceSetting.findUnique({ where: { workspaceId } });
    return merge('workspace', row?.values);
});

/** Check if a user preference key corresponds to a capability that's disabled by plan/admin. */
async function validateUserPreferenceAgainstPlan(
    userId: string,
    prefs: SettingsMap
): Promise<Record<string, string> | null> {
    // Get the user's workspace to check plan
    const workspace = await prisma.workspace.findFirst({ where: { ownerId: userId } });
    if (!workspace) return null;

    const plan = await getWorkspaceOwnerPlan(workspace.id);
    const planConfig = await getPlanConfig(plan);
    const systemSettings = await getSystemSettings();

    const errors: Record<string, string> = {};

    for (const [key, value] of Object.entries(prefs)) {
        // Find the capability that corresponds to this preference key
        const def = Object.values(CAPABILITIES).find((c) => c.userPreferenceKey === key);
        if (!def) continue; // Not a capability-gated preference

        const planAllows = def.planFeatureKey ? planConfig.features[def.planFeatureKey] ?? false : true;
        const adminAllows = def.adminSettingKey ? systemSettings[def.adminSettingKey] !== false : true;

        // If the preference is being set to true/enabled but plan or admin disallows it
        if (value === true || value === 'true' || value === 'on' || value === 1) {
            if (!planAllows) {
                errors[key] = `Cannot enable ${def.label}: not included in your plan (${plan})`;
            } else if (!adminAllows) {
                errors[key] = `Cannot enable ${def.label}: disabled by administrator`;
            }
        }
    }

    return Object.keys(errors).length > 0 ? errors : null;
}

// ---------------------------------------------------------------- writes
type Actor = { adminId?: string; userId?: string };
type Patch = { set: SettingsMap; reset: string[] };

function auditRows(
    scope: SettingScope,
    scopeId: string | null,
    actor: Actor,
    before: SettingsMap,
    after: SettingsMap,
    keys: string[],
) {
    return keys
        .filter((k) => before[k] !== after[k])
        .map((key) => ({
            scope,
            scopeId,
            key,
            actorAdminId: actor.adminId ?? null,
            actorUserId: actor.userId ?? null,
            oldValue: json(before[key]),
            newValue: json(after[key]),
        }));
}

function applyPatch(stored: unknown, p: Patch): Record<string, SettingValue> {
    const next: Record<string, SettingValue> = {
        ...((stored as Record<string, SettingValue>) ?? {}),
    };
    for (const k of p.reset) delete next[k];
    Object.assign(next, p.set);
    return next;
}

export type UpdateResult =
    { ok: true; values: SettingsMap } | { ok: false; errors: Record<string, string> };

export async function updateSystemSettings(adminId: string, patch: unknown): Promise<UpdateResult> {
    const v = validatePatch('system', patch);
    if (!v.ok) return v;
    const rows = await prisma.systemSetting.findMany();
    const storedBefore = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    const before = merge('system', storedBefore);
    const after = merge('system', applyPatch(storedBefore, v));

    const ops: Prisma.PrismaPromise<unknown>[] = [
        ...Object.entries(v.set).map(([key, value]) =>
            prisma.systemSetting.upsert({
                where: { key },
                create: { key, value: json(value), updatedByAdminId: adminId },
                update: { value: json(value), updatedByAdminId: adminId },
            }),
        ),
        ...(v.reset.length
            ? [prisma.systemSetting.deleteMany({ where: { key: { in: v.reset } } })]
            : []),
    ];
    const audit = auditRows('system', null, { adminId }, before, after, [
        ...Object.keys(v.set),
        ...v.reset,
    ]);
    if (audit.length) ops.push(prisma.settingsAudit.createMany({ data: audit }));
    if (ops.length) await prisma.$transaction(ops);
    return { ok: true, values: after };
}

export async function updateUserPreferences(userId: string, patch: unknown): Promise<UpdateResult> {
    const v = validatePatch('user', patch);
    if (!v.ok) return v;
    const row = await prisma.userPreference.findUnique({ where: { userId } });
    const stored = applyPatch(row?.values, v);

    // Validate feature preferences against plan/admin settings
    const planErrors = await validateUserPreferenceAgainstPlan(userId, v.set);
    if (planErrors) {
        return { ok: false, errors: planErrors };
    }

    await prisma.userPreference.upsert({
        where: { userId },
        create: { userId, values: json(stored) },
        update: { values: json(stored) },
    });
    return { ok: true, values: merge('user', stored) };
}

export async function resetUserPreferences(userId: string): Promise<SettingsMap> {
    await prisma.userPreference.deleteMany({ where: { userId } });
    return defaultsFor('user');
}

export async function updateWorkspaceSettings(
    workspaceId: string,
    userId: string,
    patch: unknown,
): Promise<UpdateResult> {
    const v = validatePatch('workspace', patch);
    if (!v.ok) return v;
    const row = await prisma.workspaceSetting.findUnique({ where: { workspaceId } });
    const before = merge('workspace', row?.values);
    const stored = applyPatch(row?.values, v);
    const after = merge('workspace', stored);
    const audit = auditRows('workspace', workspaceId, { userId }, before, after, [
        ...Object.keys(v.set),
        ...v.reset,
    ]);
    await prisma.$transaction([
        prisma.workspaceSetting.upsert({
            where: { workspaceId },
            create: { workspaceId, values: json(stored) },
            update: { values: json(stored) },
        }),
        ...(audit.length ? [prisma.settingsAudit.createMany({ data: audit })] : []),
    ]);
    return { ok: true, values: after };
}
