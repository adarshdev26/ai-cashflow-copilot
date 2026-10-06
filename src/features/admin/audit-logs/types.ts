export type AuditActorType = 'ADMIN' | 'USER' | 'SYSTEM';

export type AuditLogRow = {
    id: string;
    createdAt: string;
    actorId: string | null;
    actorType: AuditActorType;
    actorName: string | null;
    actorEmail: string | null;
    action: string;
    resourceType: string;
    resourceId: string | null;
    workspaceId: string | null;
};

export type AuditLogDetail = AuditLogRow & {
    metadata: Record<string, unknown> | null;
    ip: string | null;
    userAgent: string | null;
};

export type AuditLogSortField = 'createdAt';

export type AuditLogFilters = {
    search?: string;
    action?: string;
    resourceType?: string;
    dateFrom?: string; // YYYY-MM-DD
    dateTo?: string; // YYYY-MM-DD
};