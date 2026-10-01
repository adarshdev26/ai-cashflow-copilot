import { toScheduleDate } from '@/lib/recurring-dates';
import { prisma } from '@/lib/prisma';
import { getAccountError } from '@/features/accounts/lib/check-account';
import { getCategoryError } from '@/lib/categories';

const MAX_AMOUNT = 1_000_000_000;
const MAX_DESC = 255;
const MAX_NAME = 80;

export type TemplateDateModeValue = 'FIXED' | 'TODAY';

export interface ValidTemplateData {
  name?: string;
  type?: 'CREDIT' | 'DEBIT';
  amount?: number | null;
  description?: string | null;
  accountId?: string | null;
  categoryId?: string | null;
  dateMode?: TemplateDateModeValue;
  fixedDate?: Date | null;
}
type Result = { ok: true; data: ValidTemplateData } | { ok: false; error: string };

export function validateTemplateInput(input: unknown, opts: { partial: boolean }): Result {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: 'Invalid body' };
  }
  const body = input as Record<string, unknown>;
  const p = opts.partial;
  const d: ValidTemplateData = {};
  const has = (k: string) => body[k] !== undefined;

  if (!p || has('name')) {
    if (typeof body.name !== 'string') return { ok: false, error: 'Name is required' };
    const n = body.name.trim();
    if (!n) return { ok: false, error: 'Name is required' };
    if (n.length > MAX_NAME) return { ok: false, error: `Name must be ${MAX_NAME} characters or fewer` };
    d.name = n;
  }

  if (!p || has('type')) {
    if (body.type !== 'CREDIT' && body.type !== 'DEBIT') return { ok: false, error: 'Invalid type' };
    d.type = body.type;
  }

  // Amount is optional: empty means "ask me each time".
  if (has('amount')) {
    if (body.amount === null || body.amount === '') {
      d.amount = null;
    } else {
      const n = Number(body.amount);
      if (!Number.isFinite(n) || n <= 0) return { ok: false, error: 'Amount must be a positive number' };
      if (n > MAX_AMOUNT) return { ok: false, error: 'Amount is too large' };
      const rounded = Math.round(n * 100) / 100;
      if (rounded <= 0) return { ok: false, error: 'Amount must be at least 0.01' };
      d.amount = rounded;
    }
  } else if (!p) d.amount = null;

  if (has('description')) {
    if (body.description === null) d.description = null;
    else if (typeof body.description !== 'string') return { ok: false, error: 'Invalid description' };
    else {
      const t = body.description.trim();
      if (t.length > MAX_DESC) return { ok: false, error: `Description must be ${MAX_DESC} characters or fewer` };
      d.description = t || null;
    }
  } else if (!p) d.description = null;

  if (has('accountId')) {
    if (body.accountId !== null && typeof body.accountId !== 'string') return { ok: false, error: 'Invalid account' };
    d.accountId = (body.accountId as string | null) || null;
  } else if (!p) d.accountId = null;

  if (has('categoryId')) {
    if (body.categoryId !== null && typeof body.categoryId !== 'string') return { ok: false, error: 'Invalid category' };
    d.categoryId = (body.categoryId as string | null) || null;
  } else if (!p) d.categoryId = null;

  if (has('dateMode')) {
    if (body.dateMode !== 'FIXED' && body.dateMode !== 'TODAY') return { ok: false, error: 'Invalid date mode' };
    d.dateMode = body.dateMode;
  } else if (!p) d.dateMode = 'TODAY';

  if (has('fixedDate')) {
    if (body.fixedDate === null || body.fixedDate === '') {
      d.fixedDate = null;
    } else {
      if (typeof body.fixedDate !== 'string') return { ok: false, error: 'Invalid date (use YYYY-MM-DD)' };
      try {
        d.fixedDate = toScheduleDate(body.fixedDate);
      } catch {
        return { ok: false, error: 'Invalid date (use YYYY-MM-DD)' };
      }
    }
  } else if (!p) d.fixedDate = null;

  // On create, enforce the date rules right here. PATCH merges with stored values in the route.
  if (!p) {
    if (d.dateMode === 'FIXED' && !d.fixedDate) return { ok: false, error: 'Fixed date is required' };
    if (d.dateMode === 'TODAY') d.fixedDate = null;
  }

  return { ok: true, data: d };
}

/** Case-insensitive duplicate name check inside one workspace. */
export async function isTemplateNameTaken(workspaceId: string, name: string, excludeId?: string) {
  const row = await prisma.transactionTemplate.findFirst({
    where: {
      workspaceId,
      name: { equals: name, mode: 'insensitive' },
      ...(excludeId && { id: { not: excludeId } }),
    },
    select: { id: true },
  });
  return !!row;
}

/** For CREATE: optional account/category must belong to the workspace, be active and match the type. */
export async function checkTemplateTargets(
  workspaceId: string,
  type: 'CREDIT' | 'DEBIT',
  accountId: string | null,
  categoryId: string | null,
): Promise<string | null> {
  if (accountId) {
    const a = await getAccountError(workspaceId, accountId, { requireActive: true });
    if (a) return a;
  }
  if (categoryId) {
    return getCategoryError(categoryId, workspaceId, { type, requireActive: true });
  }
  return null;
}