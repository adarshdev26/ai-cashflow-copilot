const compact = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 });
const full = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export const formatCompact = (value: number) => `₹${compact.format(value)}`;
export const formatCurrency = (value: number) => full.format(value);
export const formatDay = (date: string, withYear = false) =>
  new Date(`${date}T00:00:00`).toLocaleDateString(
    'en-IN',
    withYear ? { day: 'numeric', month: 'short', year: '2-digit' } : { day: 'numeric', month: 'short' }
  );

/** Local date as 'YYYY-MM-DD'. Day precision keeps React Query keys stable. */
export const toDateInput = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;