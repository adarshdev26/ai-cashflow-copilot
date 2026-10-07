import { NextResponse } from 'next/server';
import { getPublicSettings } from '@/lib/settings/server';

// Only keys flagged `public: true` in the registry are ever returned.
export async function GET() {
  try {
    return NextResponse.json({ values: await getPublicSettings() });
  } catch (error) {
    console.error('Failed to load public settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}