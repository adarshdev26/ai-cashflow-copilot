'use client';

import { Check, X } from 'lucide-react';
import { useWorkspace } from './WorkspaceProvider';
import {
    ACTION_LABELS,
    ROLE_DESCRIPTIONS,
    ROLE_PERMISSIONS,
    type WorkspaceAction,
    type WorkspaceRole,
} from './permissions';

const ROLES: WorkspaceRole[] = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'];
const ACTIONS = Object.keys(ACTION_LABELS) as WorkspaceAction[];
const label = (r: WorkspaceRole) => r[0] + r.slice(1).toLowerCase();

export function RolesPermissionsSection() {
    const { active } = useWorkspace();

    return (
        <section
            className="bg-base-100 border-base-300 space-y-4 rounded-xl border p-6 shadow-sm"
            data-tour="settings-role-permissions"
        >
            <div>
                <h2 className="text-base-content text-lg font-semibold">Roles &amp; permissions</h2>
                <p className="text-base-content/60 mt-1 text-sm">
                    Your role in this workspace is{' '}
                    <span className="text-primary font-medium">{label(active.role)}</span>.
                </p>
            </div>

            <div className="border-base-300 overflow-x-auto rounded-lg border">
                <table className="divide-base-300 min-w-full divide-y text-left text-sm">
                    <thead className="bg-base-200 text-base-content/60">
                        <tr>
                            <th className="px-4 py-3 font-medium">Action</th>
                            {ROLES.map((role) => (
                                <th
                                    key={role}
                                    className={`px-4 py-3 align-top ${role === active.role ? 'bg-primary/10 text-primary' : ''}`}
                                >
                                    <div className="font-medium">
                                        {label(role)}
                                        {role === active.role && (
                                            <span className="bg-primary text-primary-content ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold">
                                                Your role
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-base-content/60 mt-1 text-xs font-normal">
                                        {ROLE_DESCRIPTIONS[role]}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-base-200 bg-base-100 divide-y">
                        {ACTIONS.map((action) => (
                            <tr key={action}>
                                <td className="text-base-content/80 px-4 py-2.5">
                                    {ACTION_LABELS[action]}
                                </td>
                                {ROLES.map((role) => {
                                    const allowed = ROLE_PERMISSIONS[role].includes(action);
                                    return (
                                        <td
                                            key={role}
                                            className={`px-4 py-2.5 ${role === active.role ? 'bg-primary/10' : ''}`}
                                        >
                                            {allowed ? (
                                                <Check
                                                    className="text-success h-4 w-4"
                                                    aria-label="Allowed"
                                                />
                                            ) : (
                                                <X
                                                    className="text-base-content/40 h-4 w-4"
                                                    aria-label="Not allowed"
                                                />
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
