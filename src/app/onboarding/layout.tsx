import { redirect } from 'next/navigation';
import { getValidUserWithOnboarding } from '@/lib/session-guard';

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const user = await getValidUserWithOnboarding();
  if (!user) redirect('/api/auth/invalid');
  if (user.onboardingCompletedAt) redirect('/dashboard');

  // Dedicated setup screen: no sidebar, no workspace header. Matches the login card style.
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4 py-10 text-white">
      <div className="w-full max-w-lg">{children}</div>
    </div>
  );
}