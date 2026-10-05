const currencyFormatters = new Map<string, Intl.NumberFormat>();

export function formatINR(n: number, locale = 'en-IN') {
  let formatter = currencyFormatters.get(locale);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    });
    currencyFormatters.set(locale, formatter);
  }
  return formatter.format(n);
}

/** Browser-local month boundaries as ISO instants (same convention as the finance summary). */
export function monthRange(year: number, month: number) {
  return {
    from: new Date(year, month, 1).toISOString(),
    to: new Date(year, month + 1, 1).toISOString(),
  };
}

export function monthLabel(year: number, month: number, locale = 'en-IN') {
  return new Date(year, month, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
}

export function usageTone(percentUsed: number, warningPercent: number, exceededPercent: number) {
  if (percentUsed > exceededPercent) return { bar: 'bg-error', text: 'text-error' };
  if (percentUsed >= warningPercent) return { bar: 'bg-warning', text: 'text-warning' };
  return { bar: 'bg-success', text: 'text-success' };
}

export function isPastMonth(year: number, month: number): boolean {
  const now = new Date();
  return year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth());
}

export function categoryColor(color: string | null | undefined): string {
  return color && /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#6366f1';
}
