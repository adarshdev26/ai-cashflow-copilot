export type CurrentUser = {
    id: string;
    name?: string | null;
    email: string;
    onboardingCompletedAt: string | null;
    impersonating?: boolean;
    adminEmail?: string | null;
};
