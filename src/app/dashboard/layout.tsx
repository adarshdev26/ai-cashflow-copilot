import { DashboardShell } from '@/components/layout/DashboardShell';
import { WorkspaceProvider } from '@/features/workspaces';
import { getValidUserWithOnboarding } from '@/lib/session-guard';
import { redirect } from 'next/navigation';
import { AppThemeProvider } from '@/components/providers/AppThemeProvider';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await getValidUserWithOnboarding();
  if (!user) redirect('/api/auth/invalid');
  if (!user.onboardingCompletedAt) redirect('/onboarding');

  return (
    <AppThemeProvider>
      <WorkspaceProvider>
        <DashboardShell>{children}</DashboardShell>
      </WorkspaceProvider>
    </AppThemeProvider>
  );
}