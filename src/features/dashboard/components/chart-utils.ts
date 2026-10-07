export {
    formatCompact,
    formatCurrency,
    formatDay,
    formatReportBucket,
} from '@/components/ui/chart/chart-formatters';

/** Local date as 'YYYY-MM-DD'. Day precision keeps React Query keys stable. */
export const toDateInput = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
