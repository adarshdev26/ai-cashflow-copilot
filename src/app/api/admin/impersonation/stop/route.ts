import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { clearImpersonationSession } from '@/lib/admin/impersonation';

export async function POST() {
  const g = await requireAdmin();
  if (!g.ok) return g.response;

  await clearImpersonationSession();

  return NextResponse.json({ ok: true, redirectTo: '/admin/users' }, { status: 200 });
}
