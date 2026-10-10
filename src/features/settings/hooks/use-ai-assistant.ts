'use client';

import { useActiveWorkspaceId } from '@/features/workspaces';
import { usePublicSettings, useWorkspaceSettings } from './use-settings';

/** True unless an admin or this workspace has turned the assistant off. */
export function useAiAssistantEnabled() {
    const workspaceId = useActiveWorkspaceId();
    const { data: workspace } = useWorkspaceSettings(workspaceId);
    const { data: admin } = usePublicSettings();
    return workspace?.enableAiAssistant !== false && admin?.['features.aiAssistantEnabled'] !== false;
}
