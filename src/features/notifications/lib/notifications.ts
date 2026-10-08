// Pure helpers (no React, no Prisma). Safe on client and server.
import { daysUntil, type AlertSeverity } from '@/features/dashboard/utils/dashboard-insights';
import type { NotificationType } from '../types';

export const GOAL_PROXIMITY_THRESHOLD = 5000; // INR remaining
export const GOAL_PROXIMITY_DAYS = 14;
export const SAVINGS_ALERT_PCT = 5; // percentage-point improvement vs last month
export const MAX_NOTIFICATION_CANDIDATES = 200;

export type NotificationCandidate = {
    key: string;
    type: NotificationType;
    severity: AlertSeverity;
    title: string;
    description: string;
    href: string;
};

/**
 * Key = TYPE:resource:period. The period makes a dismissed alert come back
 * next month / next occurrence instead of staying hidden forever.
 */
export function makeKey(type: NotificationType, ...parts: (string | number)[]): string {
    return [type, ...parts].join(':');
}

export const typeFromKey = (key: string) => key.split(':')[0];

export const isoDay = (d: Date | string) => new Date(d).toISOString().slice(0, 10);
export const monthKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

export type GoalLike = {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: Date | string;
    status: string;
};

export function goalProximityAlerts(
    goals: GoalLike[],
    fmt: (n: number) => string,
    now: Date = new Date(),
): NotificationCandidate[] {
    const out: NotificationCandidate[] = [];
    for (const g of goals) {
        if (g.status !== 'ACTIVE') continue;
        const remaining = g.targetAmount - g.currentAmount;
        if (remaining <= 0) continue;
        const days = daysUntil(new Date(g.targetDate), now);
        if (remaining <= GOAL_PROXIMITY_THRESHOLD) {
            out.push({
                key: makeKey('GOAL_PROXIMITY', g.id, 'near'),
                type: 'GOAL_PROXIMITY',
                severity: 'info',
                title: `Almost there: ${g.name}`,
                description: `You're ${fmt(remaining)} away from your ${g.name} goal`,
                href: '/dashboard/goals',
            });
        } else if (days >= 0 && days <= GOAL_PROXIMITY_DAYS) {
            out.push({
                key: makeKey('GOAL_PROXIMITY', g.id, 'deadline'),
                type: 'GOAL_PROXIMITY',
                severity: 'warning',
                title: `${g.name} deadline is near`,
                description: `${fmt(remaining)} still needed, ${days === 0 ? 'due today' : `${days} day(s) left`}`,
                href: '/dashboard/goals',
            });
        }
    }
    return out;
}

/** Returns the improvement in savings rate (percentage points) or null. */
export function savingsImprovement(thisRate: number | null, lastRate: number | null): number | null {
    if (thisRate == null || lastRate == null || thisRate <= 0) return null;
    const diff = thisRate - lastRate;
    return diff >= SAVINGS_ALERT_PCT ? diff : null;
}