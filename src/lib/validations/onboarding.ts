export const ONBOARDING_GOALS = [
  'track_spending',
  'save_more',
  'manage_business',
  'clear_debt',
] as const;
export type OnboardingGoal = (typeof ONBOARDING_GOALS)[number];

export const SUPPORTED_CURRENCIES = ['INR'] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const WORKSPACE_NAME_MIN = 2;
export const WORKSPACE_NAME_MAX = 60;

export type OnboardingSetupInput = {
  name: string;
  currency: SupportedCurrency;
  /** undefined = leave unchanged, null = clear */
  primaryGoal?: OnboardingGoal | null;
};

type ValidationResult =
  | { ok: true; data: OnboardingSetupInput }
  | { ok: false; error: string };

export function validateOnboardingSetup(body: unknown): ValidationResult {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, error: 'Invalid request body' };
  }
  const { name, currency, primaryGoal } = body as Record<string, unknown>;

  if (typeof name !== 'string') {
    return { ok: false, error: 'Workspace name is required' };
  }
  const trimmedName = name.trim();
  if (trimmedName.length < WORKSPACE_NAME_MIN || trimmedName.length > WORKSPACE_NAME_MAX) {
    return {
      ok: false,
      error: `Workspace name must be ${WORKSPACE_NAME_MIN}-${WORKSPACE_NAME_MAX} characters`,
    };
  }

  // Currency is optional; default INR. Only supported values are accepted.
  const resolvedCurrency = currency === undefined ? 'INR' : currency;
  if (!(SUPPORTED_CURRENCIES as readonly unknown[]).includes(resolvedCurrency)) {
    return { ok: false, error: 'Unsupported currency' };
  }

  let resolvedGoal: OnboardingGoal | null | undefined;
  if (primaryGoal === undefined) {
    resolvedGoal = undefined;
  } else if (primaryGoal === null || primaryGoal === '') {
    resolvedGoal = null;
  } else if ((ONBOARDING_GOALS as readonly unknown[]).includes(primaryGoal)) {
    resolvedGoal = primaryGoal as OnboardingGoal;
  } else {
    return { ok: false, error: 'Invalid goal' };
  }

  return {
    ok: true,
    data: {
      name: trimmedName,
      currency: resolvedCurrency as SupportedCurrency,
      primaryGoal: resolvedGoal,
    },
  };
}