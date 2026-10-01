const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

export const formatINR = (n: number) => inr.format(n);

/** Browser-local month boundaries as ISO instants (same convention as the finance summary). */
export function monthRange(year: number, month: number) {
  return {
    from: new Date(year, month, 1).toISOString(),
    to: new Date(year, month + 1, 1).toISOString(),
  };
}

export function monthLabel(year: number, month: number) {
  return new Date(year, month, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

export function usageTone(percentUsed: number) {
  if (percentUsed > 100) return { bar: 'bg-red-500', text: 'text-red-600' };
  if (percentUsed >= 80) return { bar: 'bg-amber-500', text: 'text-amber-600' };
  return { bar: 'bg-emerald-500', text: 'text-emerald-600' };
}

export function isPastMonth(year: number, month: number): boolean {
  const now = new Date();
  return year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth());
}

export function categoryColor(color: string | null | undefined): string {
  return color && /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#6366f1';
}