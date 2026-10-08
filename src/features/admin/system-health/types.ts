export type ServiceHealthStatus = 'healthy' | 'degraded' | 'down' | 'not_configured' | 'unknown';
export type ServiceId = 'api' | 'database' | 'auth' | 'cron';

/** Plain-language explanation sent by the backend for each service card. */
export type ServiceInfo = {
    what: string; // what this service is
    how: string[]; // how we check it
    degradedWhen: string;
    downWhen: string;
    nextStep: string; // advice for the CURRENT status
};

/** Plain-language explanation of the whole page. */
export type HealthGuide = {
    howItWorks: string[];
    statuses: { status: ServiceHealthStatus; label: string; meaning: string }[];
    errorCodes: { code: string; meaning: string }[];
    limits: string[];
};

export type ServiceStatus = {
    id: ServiceId;
    name: string;
    status: ServiceHealthStatus;
    detail: string;
    latencyMs: number | null;
    /** Only set for the API check: time of the latest 5xx. */
    lastIncidentAt: string | null;
    checkedAt: string;
    info: ServiceInfo;
};

export type SystemHealthResponse = {
    services: ServiceStatus[];
    guide: HealthGuide;
    checkedAt: string;
};

export type ErrorLogRow = {
    id: string;
    createdAt: string;
    method: string;
    path: string;
    status: number;
    message: string;
    errorName: string | null;
};

export type ErrorLogSortField = 'createdAt' | 'status' | 'path' | 'method';

export type ErrorLogFilters = {
    search?: string;
    status?: string; // '5xx' | '4xx' | '429'
    dateFrom?: string; // YYYY-MM-DD
    dateTo?: string; // YYYY-MM-DD
};