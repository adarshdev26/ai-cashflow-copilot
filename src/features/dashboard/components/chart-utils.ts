const compact = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 });
const full = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export const formatCompact = (value: number) => `₹${compact.format(value)}`;
export const formatCurrency = (value: number) => full.format(value);
export const formatDay = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });