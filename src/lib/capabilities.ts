import {
    PLAN_FEATURES,
    type PlanFeatureKey,
} from '@/lib/plans/constants';
import type { SettingValue } from '@/lib/settings/registry';

export type CapabilityKey = PlanFeatureKey;

export interface CapabilityDef {
    key: CapabilityKey;
    label: string;
    description: string;
    planFeatureKey: PlanFeatureKey;
    adminSettingKey?: string;
    userPreferenceKey?: string;
}

export const CAPABILITIES: Record<CapabilityKey, CapabilityDef> = {
    export: {
        key: 'export',
        label: PLAN_FEATURES.export,
        description: 'Export transactions and reports as CSV',
        planFeatureKey: 'export',
        adminSettingKey: 'features.csvExportEnabled',
        userPreferenceKey: 'features.exportEnabled',
    },
    import: {
        key: 'import',
        label: PLAN_FEATURES.import,
        description: 'Import transactions from CSV',
        planFeatureKey: 'import',
        adminSettingKey: 'features.csvImportEnabled',
        userPreferenceKey: 'features.importEnabled',
    },
    invitations: {
        key: 'invitations',
        label: PLAN_FEATURES.invitations,
        description: 'Invite members to workspaces',
        planFeatureKey: 'invitations',
        adminSettingKey: 'features.invitationsEnabled',
        userPreferenceKey: 'features.invitationsEnabled',
    },
    receipts: {
        key: 'receipts',
        label: PLAN_FEATURES.receipts,
        description: 'Attach receipts to transactions',
        planFeatureKey: 'receipts',
        adminSettingKey: 'features.receiptsEnabled',
        userPreferenceKey: 'features.receiptsEnabled',
    },
    reports: {
        key: 'reports',
        label: PLAN_FEATURES.reports,
        description: 'View financial reports',
        planFeatureKey: 'reports',
        adminSettingKey: 'features.reportsEnabled',
        userPreferenceKey: 'features.reportsEnabled',
    },
};

export type EffectiveCapability = {
    allowed: boolean;
    blockedBy: 'plan' | 'admin' | 'user' | 'none';
    planAllows: boolean;
    adminAllows: boolean;
};

export function getEffectiveCapability(
    key: CapabilityKey,
    planFeatures: Record<PlanFeatureKey, boolean>,
    adminSettings: Record<string, SettingValue>,
    userPrefs?: Record<string, SettingValue>
): EffectiveCapability {
    const def = CAPABILITIES[key];
    if (!def) {
        return { allowed: true, blockedBy: 'none', planAllows: true, adminAllows: true };
    }

    const planAllows = def.planFeatureKey ? planFeatures[def.planFeatureKey] ?? false : true;
    const adminAllows = def.adminSettingKey
        ? adminSettings[def.adminSettingKey] !== false
        : true;
    const userAllows = def.userPreferenceKey && userPrefs
        ? userPrefs[def.userPreferenceKey] !== false
        : true;

    if (!planAllows) {
        return { allowed: false, blockedBy: 'plan', planAllows: false, adminAllows };
    }
    if (!adminAllows) {
        return { allowed: false, blockedBy: 'admin', planAllows: true, adminAllows: false };
    }
    if (!userAllows) {
        return { allowed: false, blockedBy: 'user', planAllows: true, adminAllows: true };
    }
    return { allowed: true, blockedBy: 'none', planAllows: true, adminAllows: true };
}