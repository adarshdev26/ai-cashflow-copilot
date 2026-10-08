import type { AlertSeverity } from '@/features/dashboard/utils/dashboard-insights';
import type { Paged } from '@/features/admin/shared/types';

export const NOTIFICATION_TYPES = [
    'BUDGET_WARN',
    'BUDGET_EXCEEDED',
    'PAYMENT_DUE_SOON',
    'INCOME_EXPECTED',
    'GOAL_PROXIMITY',
    'SAVINGS_TREND',
    'SPENDING_UP',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export function isNotificationType(v: unknown): v is NotificationType {
    return typeof v === 'string' && (NOTIFICATION_TYPES as readonly string[]).includes(v);
}

export const NOTIFICATION_TYPE_LABEL: Record<NotificationType, string> = {
    BUDGET_WARN: 'Budget warning',
    BUDGET_EXCEEDED: 'Budget exceeded',
    PAYMENT_DUE_SOON: 'Payment due',
    INCOME_EXPECTED: 'Income expected',
    GOAL_PROXIMITY: 'Savings goal',
    SAVINGS_TREND: 'Savings',
    SPENDING_UP: 'Spending',
};

export type NotificationSeverity = AlertSeverity;

/** `id` is the dedupeKey: generated notifications have no DB row until the user acts on them. */
export type NotificationDTO = {
    id: string;
    type: NotificationType;
    severity: NotificationSeverity;
    title: string;
    description: string;
    href: string;
    isRead: boolean;
};

export type NotificationListParams = {
    page?: number;
    limit?: number;
    read?: 'true' | 'false';
    type?: NotificationType;
};

export type NotificationListResponse = Paged<NotificationDTO>;
export type NotificationCount = { unread: number; total: number };