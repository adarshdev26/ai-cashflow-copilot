export const AUDIT_ACTIONS = {
    USER_REGISTERED: 'user.registered',
    USER_SUSPENDED: 'user.suspended',
    USER_UNSUSPENDED: 'user.unsuspended',
    IMPERSONATION_STARTED: 'impersonation.started',
    IMPERSONATION_ENDED: 'impersonation.ended',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
    'user.registered': 'Registered',
    'user.suspended': 'Suspended user',
    'user.unsuspended': 'Unsuspended user',
    'impersonation.started': 'Entered support mode',
    'impersonation.ended': 'Exited support mode',
};

export const AUDIT_RESOURCE_TYPES = {
    USER: 'user',
    WORKSPACE: 'workspace',
    TRANSACTION: 'transaction',
} as const;

export type AuditResourceType = (typeof AUDIT_RESOURCE_TYPES)[keyof typeof AUDIT_RESOURCE_TYPES];

export const AUDIT_RESOURCE_LABELS: Record<AuditResourceType, string> = {
    user: 'User',
    workspace: 'Workspace',
    transaction: 'Transaction',
};

/** Label for any stored action string; falls back to the raw value for unknown/future actions. */
export function auditActionLabel(action: string): string {
    return AUDIT_ACTION_LABELS[action as AuditAction] ?? action;
}

export function auditResourceLabel(type: string, id: string | null): string {
    const base = AUDIT_RESOURCE_LABELS[type as AuditResourceType] ?? type;
    return id ? `${base} #${id.slice(0, 8)}` : base;
}