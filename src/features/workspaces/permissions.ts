export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export type WorkspaceAction =
  | 'workspace.read'
  | 'workspace.rename'
  | 'workspace.delete'
  | 'members.view'
  | 'members.add'
  | 'members.changeRole'
  | 'members.remove'
  | 'transaction.create'
  | 'transaction.update'
  | 'transaction.delete';

export const ACTION_LABELS: Record<WorkspaceAction, string> = {
  'workspace.read': 'View workspace, finance data and dashboard',
  'workspace.rename': 'Rename workspace',
  'workspace.delete': 'Delete workspace',
  'members.view': 'View member list and emails',
  'members.add': 'Add members',
  'members.changeRole': 'Change member roles',
  'members.remove': 'Remove members',
  'transaction.create': 'Create transactions',
  'transaction.update': 'Edit transactions',
  'transaction.delete': 'Delete transactions',
};

const ALL = Object.keys(ACTION_LABELS) as WorkspaceAction[];

export const ROLE_PERMISSIONS: Record<WorkspaceRole, WorkspaceAction[]> = {
  OWNER: ALL,
  ADMIN: ALL.filter((a) => a !== 'workspace.delete'),
  MEMBER: ['workspace.read', 'transaction.create', 'transaction.update', 'transaction.delete'],
  VIEWER: ['workspace.read'],
};

export const ROLE_DESCRIPTIONS: Record<WorkspaceRole, string> = {
  OWNER: 'Full control, including deleting the workspace.',
  ADMIN: 'Manages members and settings. Cannot delete the workspace.',
  MEMBER: 'Can view and manage transactions.',
  VIEWER: 'Read-only access.',
};

export function canWorkspaceAction(
  role: WorkspaceRole | null | undefined,
  action: WorkspaceAction
): boolean {
  return !!role && ROLE_PERMISSIONS[role].includes(action);
}