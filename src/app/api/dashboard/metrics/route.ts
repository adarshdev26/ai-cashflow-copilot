import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireWorkspaceAccess } from '@/lib/workspaces';

export async function GET(req: Request) {
  try {
    const access = await requireWorkspaceAccess(req, 'VIEWER');
    if (!access.ok) return access.response;

    const { workspaceId } = access;

    // Fetch workspace habit count for streak calculation
    const habitCount = await prisma.habit.count({ where: { workspaceId } });

    // Simple active habit streak calculation placeholder
    const activeHabitStreak = habitCount > 0 ? 5 : 0;

    // Fetch workspace notes count
    const pendingNotesCount = await prisma.note.count({
      where: { workspaceId },
    });

    return NextResponse.json(
      {
        activeHabitStreak,
        pendingNotesCount,
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