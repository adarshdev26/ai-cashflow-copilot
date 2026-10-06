import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/admin/auth';
import { AdminShell } from '@/components/layout/AdminShell';

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
    const session = await getAdminSession();
    if (!session) redirect('/api/admin/auth/invalid');
    return <AdminShell>{children}</AdminShell>;
}
