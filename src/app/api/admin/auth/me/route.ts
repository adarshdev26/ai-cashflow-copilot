import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin/auth';

export async function GET() {
    const s = await getAdminSession();
    if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ id: s.adminId, name: s.name, email: s.email });
}
