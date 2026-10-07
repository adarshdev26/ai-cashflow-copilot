export type GoalStatus = 'ACTIVE' | 'ARCHIVED';
export type GoalDisplayStatus = 'ACTIVE' | 'COMPLETED' | 'OVERDUE' | 'ARCHIVED';
export type GoalContributionKind = 'ADD' | 'REMOVE';

export type GoalView = {
    id: string;
    name: string;
    description: string | null;
    targetAmount: number;
    currentAmount: number;
    targetDate: string;
    status: GoalStatus;
    displayStatus: GoalDisplayStatus;
    percentageCompleted: number;
    remainingAmount: number;
    requiredMonthlyContribution: number | null;
    createdAt: string;
    updatedAt: string;
};

export type GoalInput = {
    name: string;
    targetAmount: number;
    targetDate: string;
    description?: string | null;
};

export type CreateGoalInput = GoalInput;
export type UpdateGoalInput = GoalInput & { id: string };
export type Goal = GoalView;
export type GoalListResponse = { goals: GoalView[] };
export type GoalResponse = { goal: GoalView };
export type ContributionInput = { kind: GoalContributionKind; amount: number };
export type GoalContributionInput = ContributionInput;
export type GoalContributionResponse = { goal: GoalView };
