/**
 * Only allows same-origin, relative /invite/... paths, so ?next= can't become an open redirect.
 * Returns null for anything else.
 */
export function getSafeNextPath(next: string | null | undefined): string | null {
  if (!next || next.length > 200) return null;
  if (!next.startsWith('/invite/')) return null;
  if (next.includes('//') || next.includes('\\') || /[\u0000-\u001f]/.test(next)) return null;
  try {
    const url = new URL(next, 'http://localhost');
    if (url.origin !== 'http://localhost') return null;
  } catch {
    return null;
  }
  return next;
}