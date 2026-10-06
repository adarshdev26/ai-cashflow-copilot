import { requestUpgrade } from '@/lib/plans/upgrade-event';

export class ApiError extends Error {
    status: number;
    code?: string;
    key?: string;
    limit?: number;
    current?: number;
    plan?: string;

    constructor(
        message: string,
        status: number,
        code?: string,
        details: { key?: string; limit?: number; current?: number; plan?: string } = {},
    ) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.code = code;
        Object.assign(this, details);
    }
}

export function withWorkspace(workspaceId: string, init?: RequestInit): RequestInit {
    const headers = new Headers(init?.headers);
    headers.set('X-Workspace-Id', workspaceId);
    return { ...init, headers };
}

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
    const headers = new Headers(init?.headers);
    if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, { ...init, headers });

    if (!response.ok) {
        let errorMsg = 'An error occurred';
        let errorCode: string | undefined;
        let details: { key?: string; limit?: number; current?: number; plan?: string } = {};
        try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorData.message || errorMsg;
            if (typeof errorData.code === 'string') errorCode = errorData.code;
            details = {
                key: typeof errorData.key === 'string' ? errorData.key : undefined,
                limit: typeof errorData.limit === 'number' ? errorData.limit : undefined,
                current: typeof errorData.current === 'number' ? errorData.current : undefined,
                plan: typeof errorData.plan === 'string' ? errorData.plan : undefined,
            };
        } catch {
            errorMsg = response.statusText || errorMsg;
        }
        if (errorCode === 'PLAN_LIMIT' || errorCode === 'PLAN_FEATURE') requestUpgrade(errorMsg);
        throw new ApiError(errorMsg, response.status, errorCode, details);
    }

    // Handle empty bodies (e.g. 204 No Content or just empty response)
    const text = await response.text();
    if (!text) {
        return {} as T;
    }

    return JSON.parse(text) as T;
}
