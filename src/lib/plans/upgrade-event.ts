export const UPGRADE_EVENT = 'plan:upgrade';

/** Opens the global upgrade prompt (rendered once by <PlanUpgradeListener />). */
export function requestUpgrade(message?: string) {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(UPGRADE_EVENT, { detail: { message } }));
}
