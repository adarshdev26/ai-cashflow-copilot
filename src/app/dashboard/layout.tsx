import { DashboardShell } from '@/components/layout/DashboardShell';
import { WorkspaceProvider } from '@/features/workspaces';
import { getValidUser } from '@/lib/session-guard';
import { redirect } from 'next/navigation';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await getValidUser();
  if (!user) redirect('/api/auth/invalid');

  return (
    <WorkspaceProvider>
      <DashboardShell>{children}</DashboardShell>
    </WorkspaceProvider>
  );
}