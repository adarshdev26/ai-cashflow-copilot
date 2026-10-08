// Base TTL window: 20–50 minutes, chosen per-entry so a fleet of
// workspaces does not all expire on the same minute.
const TTL_MIN_MS = 20 * 60 * 1000;
const TTL_MAX_MS = 50 * 60 * 1000;

// Empty result ("nothing notable") is cached briefly. We want the UI to
// flip to real insights quickly once the user makes a transaction, but
// we don't want to call Gemini every page load for empty workspaces.
const EMPTY_TTL_MS = 5 * 60 * 1000;

export function randomTtlMs(): number {
    return TTL_MIN_MS + Math.floor(Math.random() * (TTL_MAX_MS - TTL_MIN_MS));
}

export function ttlFor(insightCount: number): number {
    return insightCount === 0 ? EMPTY_TTL_MS : randomTtlMs();
}