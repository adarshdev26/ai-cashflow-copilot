import { redirect } from 'next/navigation';
import { getValidUserWithOnboarding } from '@/lib/session-guard';
import { AuthShell } from '@/components/auth/AuthShell';

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const user = await getValidUserWithOnboarding();
  if (!user) redirect('/api/auth/invalid');
  if (user.onboardingCompletedAt) redirect('/dashboard');

  return (
    <AuthShell>
      <div className="w-full max-w-lg">{children}</div>
    </AuthShell>
  );
}