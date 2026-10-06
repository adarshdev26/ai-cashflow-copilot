export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export type WorkspaceAction =
    | 'workspace.read'
    | 'workspace.rename'
    | 'workspace.delete'
    | 'members.view'
    | 'members.add'
    | 'members.invite'
    | 'members.changeRole'
    | 'members.remove'
    | 'transaction.create'
    | 'transaction.update'
    | 'transaction.delete'
    | 'account.create'
    | 'account.update'
    | 'account.deactivate'
    | 'category.create'
    | 'category.delete'
    | 'category.update'
    | 'budgets.manage'
    | 'recurring.manage'
    | 'templates.manage';

export const ACTION_LABELS: Record<WorkspaceAction, string> = {
    'workspace.read': 'View workspace, finance data and dashboard',
    'workspace.rename': 'Rename workspace',
    'workspace.delete': 'Delete workspace',
    'members.view': 'View member list and emails',
    'members.add': 'Add members',
    'members.invite': 'Invite members and manage pending invitations',
    'members.changeRole': 'Change member roles',
    'members.remove': 'Remove members',
    'transaction.create': 'Create transactions',
    'transaction.update': 'Edit transactions',
    'transaction.delete': 'Delete transactions',
    'account.create': 'Create accounts',
    'account.update': 'Edit accounts',
    'account.deactivate': 'Deactivate, reactivate or delete accounts',
    'category.create': 'Create categories',
    'category.update': 'Edit categories',
    'category.delete': 'Delete categories',
    'budgets.manage': 'Create, edit and deactivate budgets',
    'recurring.manage': 'Create, edit, pause and delete recurring transactions',
    'templates.manage': 'Create, edit and delete transaction templates',
};

const ALL = Object.keys(ACTION_LABELS) as WorkspaceAction[];

export const ROLE_PERMISSIONS: Record<WorkspaceRole, WorkspaceAction[]> = {
    OWNER: ALL,
    ADMIN: ALL.filter((a) => a !== 'workspace.delete'),
    MEMBER: [
        'workspace.read',
        'transaction.create',
        'transaction.update',
        'transaction.delete',
        'account.create',
        'account.update',
        'account.deactivate',
        'category.create',
        'recurring.manage',
        'templates.manage',
    ],
    VIEWER: ['workspace.read'],
};

export const ROLE_DESCRIPTIONS: Record<WorkspaceRole, string> = {
    OWNER: 'Full control, including deleting the workspace.',
    ADMIN: 'Manages members and settings. Cannot delete the workspace.',
    MEMBER: 'Can view and manage transactions and accounts.',
    VIEWER: 'Read-only access.',
};

export function canWorkspaceAction(
    role: WorkspaceRole | null | undefined,
    action: WorkspaceAction,
): boolean {
    return !!role && ROLE_PERMISSIONS[role].includes(action);
}
