import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/admin/auth';

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const now = new Date();
    const today = new Date(now);
    today.setUTCHours(0, 0, 0, 0);
    const activityStart = new Date(today);
    activityStart.setUTCDate(activityStart.getUTCDate() - 29);
    const newUsersStart = new Date(now);
    newUsersStart.setUTCDate(newUsersStart.getUTCDate() - 30);
    const newUsersWeekStart = new Date(now);
    newUsersWeekStart.setUTCDate(newUsersWeekStart.getUTCDate() - 7);

    const [
      userCount,
      activeUsers,
      newUsers30Days,
      newUsers7Days,
      workspaceCount,
      activeWorkspaces,
      transactionCount,
      pendingInvitations,
      globalCategoryCount,
      customCategoryCount,
      transactionDates,
      userDates,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { createdAt: { gte: newUsersStart } } }),
      prisma.user.count({ where: { createdAt: { gte: newUsersWeekStart } } }),
      prisma.workspace.count(),
      prisma.workspace.count({ where: { isActive: true } }),
      prisma.transaction.count(),
      prisma.workspaceInvitation.count({ where: { status: 'PENDING', expiresAt: { gt: now } } }),
      prisma.category.count({ where: { workspaceId: null } }),
      prisma.category.count({ where: { workspaceId: { not: null } } }),
      prisma.transaction.findMany({ where: { createdAt: { gte: activityStart } }, select: { createdAt: true } }),
      prisma.user.findMany({ where: { createdAt: { gte: activityStart } }, select: { createdAt: true } }),
    ]);

    const days = Array.from({ length: 30 }, (_, index) => {
      const date = new Date(activityStart);
      date.setUTCDate(date.getUTCDate() + index);
      return { date: dayKey(date), transactions: 0, users: 0 };
    });
    const points = new Map(days.map((day) => [day.date, day]));
    for (const row of transactionDates) {
      const point = points.get(dayKey(row.createdAt));
      if (point) point.transactions += 1;
    }
    for (const row of userDates) {
      const point = points.get(dayKey(row.createdAt));
      if (point) point.users += 1;
    }

    return NextResponse.json({
      users: { total: userCount, active: activeUsers, inactive: userCount - activeUsers, new7Days: newUsers7Days, new30Days: newUsers30Days },
      workspaces: { total: workspaceCount, active: activeWorkspaces, inactive: workspaceCount - activeWorkspaces },
      transactions: { total: transactionCount },
      pendingInvitations,
      categories: { global: globalCategoryCount, custom: customCategoryCount },
      activity: days,
    });
  } catch (error) {
    console.error('Failed to fetch admin dashboard:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}