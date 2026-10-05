import { NextResponse } from 'next/server';
import type { Prisma } from '@/generated/prisma';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/admin/auth';
import { parseListParams, paginationMeta } from '@/lib/admin/list';
import { getSystemNumber } from '@/lib/settings/server';

export async function GET(req: Request) {
  const g = await requireAdmin();
  if (!g.ok) return g.response;

  const p = parseListParams(new URL(req.url), ['createdAt', 'name'], 'createdAt', await getSystemNumber('limits.listMaxPageSize'));
  const where: Prisma.WorkspaceWhereInput = {
    ...(p.isActive !== undefined ? { isActive: p.isActive } : {}),
    ...(p.search
      ? { OR: [
          { name: { contains: p.search, mode: 'insensitive' } },
          { slug: { contains: p.search, mode: 'insensitive' } },
          { owner: { email: { contains: p.search, mode: 'insensitive' } } },
        ] }
      : {}),
  };

  const [rows, totalCount] = await Promise.all([
    prisma.workspace.findMany({
      where,
      select: {
        id: true, name: true, slug: true, currency: true, isActive: true, createdAt: true,
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { access: true } },
      },
      orderBy: { [p.sortBy]: p.sortDir }, skip: p.skip, take: p.limit,
    }),
    prisma.workspace.count({ where }),
  ]);

  const data = rows.map(({ _count, ...w }) => ({ ...w, memberCount: _count.access }));
  return NextResponse.json({ data, pagination: paginationMeta(p.page, p.limit, totalCount) });
}
