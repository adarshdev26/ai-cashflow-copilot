import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth/auth';
import { completeOnboarding } from '@/lib/users/onboarding';

export async function POST() {
  try {
    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await completeOnboarding(userId);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('Onboarding complete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}