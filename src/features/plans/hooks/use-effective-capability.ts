'use client';

import { useMemo } from 'react';
import { usePlan, useFeature } from '@/features/plans/hooks/use-plan';
import { usePublicSettings, useUserPreferences } from '@/features/settings/hooks/use-settings';
import { CAPABILITIES, type CapabilityKey, type EffectiveCapability } from '@/lib/capabilities';

export function useEffectiveCapability(key: CapabilityKey): EffectiveCapability {
    const { data: planData, isLoading: planLoading } = usePlan();
    const { data: adminSettings, isLoading: settingsLoading } = usePublicSettings();
    const { data: userPrefs, isLoading: prefsLoading } = useUserPreferences();

    return useMemo(() => {
        if (planLoading || settingsLoading || prefsLoading || !planData) {
            return { allowed: true, blockedBy: 'none', planAllows: true, adminAllows: true };
        }
        const def = CAPABILITIES[key];
        if (!def) {
            return { allowed: true, blockedBy: 'none', planAllows: true, adminAllows: true };
        }

        const planAllows = def.planFeatureKey ? planData.features[def.planFeatureKey] ?? false : true;
        const adminAllows = def.adminSettingKey ? adminSettings?.[def.adminSettingKey] !== false : true;
        const userAllows = def.userPreferenceKey ? userPrefs?.[def.userPreferenceKey] !== false : true;

        let blockedBy: 'plan' | 'admin' | 'user' | 'none' = 'none';
        if (!planAllows) blockedBy = 'plan';
        else if (!adminAllows) blockedBy = 'admin';
        else if (!userAllows) blockedBy = 'user';

        return { allowed: planAllows && adminAllows && userAllows, blockedBy, planAllows, adminAllows };
    }, [key, planData, planLoading, adminSettings, settingsLoading, userPrefs, prefsLoading]);
}

export function useEffectiveCapabilities(keys: CapabilityKey[]): Record<CapabilityKey, EffectiveCapability> {
    const { data: planData, isLoading: planLoading } = usePlan();
    const { data: adminSettings, isLoading: settingsLoading } = usePublicSettings();
    const { data: userPrefs, isLoading: prefsLoading } = useUserPreferences();

    return useMemo(() => {
        if (planLoading || settingsLoading || prefsLoading || !planData) {
            const result: Record<CapabilityKey, EffectiveCapability> = {} as Record<CapabilityKey, EffectiveCapability>;
            for (const key of keys) {
                result[key] = { allowed: true, blockedBy: 'none', planAllows: true, adminAllows: true };
            }
            return result;
        }
        const result: Record<CapabilityKey, EffectiveCapability> = {} as Record<CapabilityKey, EffectiveCapability>;
        for (const key of keys) {
            const def = CAPABILITIES[key];
            if (!def) {
                result[key] = { allowed: true, blockedBy: 'none', planAllows: true, adminAllows: true };
                continue;
            }
            const planAllows = def.planFeatureKey ? planData.features[def.planFeatureKey] ?? false : true;
            const adminAllows = def.adminSettingKey ? adminSettings?.[def.adminSettingKey] !== false : true;
            const userAllows = def.userPreferenceKey ? userPrefs?.[def.userPreferenceKey] !== false : true;

            let blockedBy: 'plan' | 'admin' | 'user' | 'none' = 'none';
            if (!planAllows) blockedBy = 'plan';
            else if (!adminAllows) blockedBy = 'admin';
            else if (!userAllows) blockedBy = 'user';

            result[key] = { allowed: planAllows && adminAllows && userAllows, blockedBy, planAllows, adminAllows };
        }
        return result;
    }, [keys, planData, planLoading, adminSettings, settingsLoading, userPrefs, prefsLoading]);
}

export function useCapability(key: CapabilityKey) {
    const { enabled: planEnabled, isLoading: planLoading } = useFeature(CAPABILITIES[key]?.planFeatureKey ?? 'export');
    const { data: adminSettings, isLoading: settingsLoading } = usePublicSettings();
    const { data: userPrefs, isLoading: prefsLoading } = useUserPreferences();

    return useMemo(() => {
        if (planLoading || settingsLoading || prefsLoading) {
            return { allowed: true, blockedBy: 'none' as const };
        }
        const def = CAPABILITIES[key];
        if (!def) return { allowed: true, blockedBy: 'none' as const };

        const adminAllows = def.adminSettingKey ? adminSettings?.[def.adminSettingKey] !== false : true;
        const userAllows = def.userPreferenceKey ? userPrefs?.[def.userPreferenceKey] !== false : true;
        const allowed = planEnabled && adminAllows && userAllows;

        let blockedBy: 'plan' | 'admin' | 'user' | 'none' = 'none';
        if (!planEnabled) blockedBy = 'plan';
        else if (!adminAllows) blockedBy = 'admin';
        else if (!userAllows) blockedBy = 'user';

        return { allowed, blockedBy };
    }, [key, planEnabled, planLoading, adminSettings, settingsLoading, userPrefs, prefsLoading]);
}