import { ACCOUNT_TYPES, type AccountType } from '../types';

const MAX_NAME = 100;
const MAX_ABS_BALANCE = 1_000_000_000_000;

export type ValidatedCreateAccount = {
  name: string;
  type: AccountType;
  currency: string;
  openingBalance: number;
};

export type ValidatedUpdateAccount = Partial<{
  name: string;
  type: AccountType;
  openingBalance: number;
  isActive: boolean;
}>;

function parseName(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Account name is required');
  const name = value.trim();
  if (name.length < 1) throw new Error('Account name is required');
  if (name.length > MAX_NAME) throw new Error(`Account name must be at most ${MAX_NAME} characters`);
  return name;
}

function parseType(value: unknown): AccountType {
  if (typeof value !== 'string' || !(ACCOUNT_TYPES as readonly string[]).includes(value)) {
    throw new Error('Invalid account type');
  }
  return value as AccountType;
}

// Negative allowed (e.g. a credit card that starts with debt).
function parseMoney(value: unknown): number {
  if (typeof value !== 'number' && typeof value !== 'string') {
    throw new Error('Opening balance must be a valid amount');
  }
  const raw = typeof value === 'string' ? value.trim() : value;
  if (raw === '') throw new Error('Opening balance must be a valid amount');
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n) || Math.abs(n) > MAX_ABS_BALANCE) {
    throw new Error('Opening balance must be a valid amount');
  }
  return Math.round(n * 100) / 100;
}

function isBlank(v: unknown) {
  return v === undefined || v === null || v === '';
}

export function validateCreateAccount(data: unknown, workspaceCurrency: string): ValidatedCreateAccount {
  if (typeof data !== 'object' || data === null) throw new Error('Invalid account data');
  const { name, type, currency, openingBalance } = data as Record<string, unknown>;

  let finalCurrency = workspaceCurrency;
  if (!isBlank(currency)) {
    const c = typeof currency === 'string' ? currency.trim().toUpperCase() : '';
    if (c !== workspaceCurrency) {
      throw new Error(`Currency must match the workspace currency (${workspaceCurrency})`);
    }
    finalCurrency = c;
  }

  return {
    name: parseName(name),
    type: parseType(type),
    currency: finalCurrency,
    openingBalance: isBlank(openingBalance) ? 0 : parseMoney(openingBalance),
  };
}

// Only fields present in the body are validated and returned.
// workspaceId / currency / anything else in the body is ignored on purpose.
export function validateUpdateAccount(data: unknown): ValidatedUpdateAccount {
  if (typeof data !== 'object' || data === null) throw new Error('Invalid account data');
  const body = data as Record<string, unknown>;
  const out: ValidatedUpdateAccount = {};

  if (body.name !== undefined) out.name = parseName(body.name);
  if (body.type !== undefined) out.type = parseType(body.type);
  if (body.openingBalance !== undefined) out.openingBalance = parseMoney(body.openingBalance);
  if (body.isActive !== undefined) {
    if (typeof body.isActive !== 'boolean') throw new Error('isActive must be true or false');
    out.isActive = body.isActive;
  }

  if (Object.keys(out).length === 0) throw new Error('No valid fields to update');
  return out;
}