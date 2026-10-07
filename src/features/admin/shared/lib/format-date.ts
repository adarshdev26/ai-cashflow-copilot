const adminDateFormatter = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
});
export function formatAdminDate(iso: string) {
    return adminDateFormatter.format(new Date(iso));
}
