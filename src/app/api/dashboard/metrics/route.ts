import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// Import your authentication helper or JWT verification here depending on how you're extracting the user ID session

export async function GET(req: Request) {
  try {
    // TODO: Extract the authenticated user's ID from cookies/JWT headers
    // For demonstration, assume we retrieve a userId or pass a mock user context
    const userId = 'USER_ID_FROM_SESSION'; 

    // Fetch user's workspaces to aggregate financial data
    const workspaces = await prisma.workspace.findMany({
      where: { userId },
      include: {
        transactions: true,
      },
    });

    // Calculate Net Balance from transactions across workspaces
    let netBalance = 0;
    workspaces.forEach((workspace) => {
      workspace.transactions.forEach((tx) => {
        if (tx.type === 'CREDIT') {
          netBalance += tx.amount;
        } else if (tx.type === 'DEBIT') {
          netBalance -= tx.amount;
        }
      });
    });

    // Fetch user habits for streak calculation
    const habits = await prisma.habit.findMany({
      where: { userId },
      include: { logs: true },
    });

    // Simple active habit streak calculation placeholder
    const activeHabitStreak = habits.length > 0 ? 5 : 0;

    // Fetch notes count
    const pendingNotesCount = await prisma.note.count({
      where: { userId },
    });

    return NextResponse.json(
      {
        netBalance,
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