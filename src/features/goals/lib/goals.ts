import type { GoalDisplayStatus, GoalStatus, GoalView } from '../types';

type CalendarDate = { year: number; month: number; day: number; key: string };

function calendarDate(value: string | Date): CalendarDate | null {
    let year: number;
    let month: number;
    let day: number;
    if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) return null;
        year = value.getUTCFullYear();
        month = value.getUTCMonth() + 1;
        day = value.getUTCDate();
    } else {
        const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
        if (!match) return null;
        year = Number(match[1]);
        month = Number(match[2]);
        day = Number(match[3]);
        const check = new Date(Date.UTC(year, month - 1, day));
        if (
            check.getUTCFullYear() !== year ||
            check.getUTCMonth() + 1 !== month ||
            check.getUTCDate() !== day
        ) {
            return null;
        }
    }
    const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return { year, month, day, key };
}

function localCalendarDate(value: Date): CalendarDate | null {
    if (Number.isNaN(value.getTime())) return null;
    const year = value.getFullYear();
    const month = value.getMonth() + 1;
    const day = value.getDate();
    return {
        year,
        month,
        day,
        key: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    };
}

export function getGoalProgress(currentAmount: number, targetAmount: number) {
    const remainingAmount = Math.max(targetAmount - currentAmount, 0);
    const percentageCompleted =
        targetAmount > 0 ? Math.min(100, Math.max(0, (currentAmount / targetAmount) * 100)) : 0;
    return { percentageCompleted, remainingAmount };
}

export function getRequiredMonthlyContribution(
    currentAmount: number,
    targetAmount: number,
    targetDate: string | Date,
    today = new Date(),
): number | null {
    const remaining = Math.max(targetAmount - currentAmount, 0);
    if (remaining === 0) return 0;
    const target = calendarDate(targetDate);
    const current = localCalendarDate(today);
    if (!target || !current || target.key < current.key) return null;
    const months = (target.year - current.year) * 12 + target.month - current.month + 1;
    if (months <= 0) return null;
    return Math.ceil((remaining / months) * 100) / 100;
}

export function getGoalStatus(
    status: 'ACTIVE' | 'ARCHIVED',
    currentAmount: number,
    targetAmount: number,
    targetDate: string | Date,
    today = new Date(),
): GoalDisplayStatus {
    if (status === 'ARCHIVED') return 'ARCHIVED';
    if (currentAmount >= targetAmount) return 'COMPLETED';
    const target = calendarDate(targetDate);
    const current = localCalendarDate(today);
    return target && current && target.key < current.key ? 'OVERDUE' : 'ACTIVE';
}

type GoalRecord = {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: Date;
    description: string | null;
    status: GoalStatus;
    createdAt: Date;
    updatedAt: Date;
};

export function toGoalView(goal: GoalRecord, today = new Date()): GoalView {
    const targetDate = goal.targetDate.toISOString();
    return {
        id: goal.id,
        name: goal.name,
        description: goal.description,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        targetDate,
        status: goal.status,
        displayStatus: getGoalStatus(
            goal.status,
            goal.currentAmount,
            goal.targetAmount,
            goal.targetDate,
            today,
        ),
        ...getGoalProgress(goal.currentAmount, goal.targetAmount),
        requiredMonthlyContribution: getRequiredMonthlyContribution(
            goal.currentAmount,
            goal.targetAmount,
            goal.targetDate,
            today,
        ),
        createdAt: goal.createdAt.toISOString(),
        updatedAt: goal.updatedAt.toISOString(),
    };
}
