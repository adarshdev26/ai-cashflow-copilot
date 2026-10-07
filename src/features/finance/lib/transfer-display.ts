type AccountRef = { id: string; name: string } | null | undefined;

export function transferAccountLabel(
    tx: { account?: AccountRef; toAccount?: AccountRef },
    activeAccountId?: string | null,
): string {
    const from = tx.account?.name ?? 'Unknown';
    const to = tx.toAccount?.name ?? 'Unknown';
    if (activeAccountId && tx.account?.id === activeAccountId) return `Transfer to ${to}`;
    if (activeAccountId && tx.toAccount?.id === activeAccountId) return `Transfer from ${from}`;
    return `${from} → ${to}`;
}
