'use client';

import { useWorkspace } from '../WorkspaceProvider';
import { canWorkspaceAction, type WorkspaceAction } from '../permissions';

export function usePermission(action: WorkspaceAction): boolean {
  return canWorkspaceAction(useWorkspace().active.role, action);
}