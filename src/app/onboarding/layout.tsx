import { redirect } from 'next/navigation';
import { getValidUserWithOnboarding } from '@/lib/auth/session-guard';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthBrand } from '@/components/auth/AuthUI';

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
    const user = await getValidUserWithOnboarding();
    if (!user) redirect('/api/auth/invalid');
    if (user.onboardingCompletedAt) redirect('/dashboard');

    return (
        <AuthShell>
            <div className="w-full max-w-lg">
                <AuthBrand className="mb-6" />
                {children}
            </div>
        </AuthShell>
    );
}
