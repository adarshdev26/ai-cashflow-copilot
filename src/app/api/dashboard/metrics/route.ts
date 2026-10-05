import { NextResponse } from 'next/server';
import { requireWorkspaceAccess } from '@/lib/auth/workspaces';

export async function GET(req: Request) {
  try {
    const access = await requireWorkspaceAccess(req, 'VIEWER');
    if (!access.ok) return access.response;

    return NextResponse.json(
      {
        activeHabitStreak: 0,
        pendingNotesCount: 0,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching metrics' },
      { status: 500 }
    );
  }
}