export const chartColors = {
  income: 'var(--color-success)',
  expense: 'var(--color-error)',
  primary: 'var(--color-primary)',
  secondary: 'var(--color-secondary)',
  accent: 'var(--color-accent)',
  info: 'var(--color-info)',
  warning: 'var(--color-warning)',
  success: 'var(--color-success)',
  base300: 'var(--color-base-300)',
  baseContent: 'var(--color-base-content)',
} as const;

const categoryColors = [
  chartColors.primary,
  chartColors.secondary,
  chartColors.accent,
  chartColors.info,
  chartColors.warning,
  chartColors.success,
];

export function categoryFallbackColor(index: number) {
  return categoryColors[index % categoryColors.length];
}
