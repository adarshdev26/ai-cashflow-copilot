import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUserId } from '@/lib/auth';

export async function GET() {
  try {
    const userId = await requireUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Fetch user habits for streak calculation
    const habitCount = await prisma.habit.count({ where: { userId } });

    // Simple active habit streak calculation placeholder
    const activeHabitStreak = habitCount > 0 ? 5 : 0;

    // Fetch notes count
    const pendingNotesCount = await prisma.note.count({
      where: { userId },
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