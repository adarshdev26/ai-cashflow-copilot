import type { OnboardingGoal } from '@/lib/validations/onboarding';

export type { OnboardingGoal };

export type OnboardingSetupInput = {
    name: string;
    currency: 'INR';
    /** undefined = leave unchanged, null = clear */
    primaryGoal?: OnboardingGoal | null;
};

export type OnboardingSetupResponse = {
    workspace: {
        workspaceId: string;
        name: string;
        currency: string;
    };
};

export const GOAL_OPTIONS: { value: OnboardingGoal; label: string }[] = [
    { value: 'track_spending', label: 'Track my spending' },
    { value: 'save_more', label: 'Save more' },
    { value: 'manage_business', label: 'Manage a business' },
    { value: 'clear_debt', label: 'Clear debt' },
];

export const WIZARD_STEPS = ['Welcome', 'Workspace', 'Invite', 'Done'] as const;
