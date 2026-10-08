// All thresholds live here. Tune by editing; no env vars needed.

export const STATUS_REFRESH_MS = 30_000;
export const CHECK_TIMEOUT_MS = 3_000;

/** Look-back window for error / login-failure counts. */
export const HEALTH_WINDOW_MINUTES = 15;

// Database
export const DB_SLOW_MS = 800;

// API: counted from ErrorLog 5xx rows inside the window (we have no request totals)
export const API_ERRORS_DEGRADED = 1;
export const API_ERRORS_DOWN = 25;

// Authentication
export const LOGIN_FAILURES_DEGRADED = 20;

// Cron: must match the schedule in vercel.json
export const CRON_EXPECTED_INTERVAL_HOURS = 24;
export const CRON_STALE_FACTOR = 1.5; // older than 1.5x interval -> degraded
export const CRON_DOWN_FACTOR = 3; // older than 3x interval -> down
