/** User text (descriptions, category names) is data, never instructions. */
export function cleanText(value: string | null | undefined, max = 60): string {
    return Array.from(value ?? '')
        .filter((ch) => {
            const c = ch.codePointAt(0) ?? 0;
            return c >= 32 && c !== 127;
        })
        .join('')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, max);
}

export function stripMarkup(value: string): string {
    return value
        .replace(/<[^>]*>/g, '')
        .replace(/[*_`#>]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}