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
    <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Roles &amp; permissions</h2>
        <p className="text-sm text-slate-500 mt-1">
          Your role in this workspace is{' '}
          <span className="font-medium text-indigo-600">{label(active.role)}</span>.
        </p>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Action</th>
              {ROLES.map((role) => (
                <th
                  key={role}
                  className={`px-4 py-3 align-top ${role === active.role ? 'bg-indigo-50 text-indigo-700' : ''}`}
                >
                  <div className="font-medium">
                    {label(role)}
                    {role === active.role && (
                      <span className="ml-2 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                        Your role
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-xs font-normal text-slate-500">{ROLE_DESCRIPTIONS[role]}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {ACTIONS.map((action) => (
              <tr key={action}>
                <td className="px-4 py-2.5 text-slate-700">{ACTION_LABELS[action]}</td>
                {ROLES.map((role) => {
                  const allowed = ROLE_PERMISSIONS[role].includes(action);
                  return (
                    <td key={role} className={`px-4 py-2.5 ${role === active.role ? 'bg-indigo-50/40' : ''}`}>
                      {allowed ? (
                        <Check className="h-4 w-4 text-emerald-600" aria-label="Allowed" />
                      ) : (
                        <X className="h-4 w-4 text-slate-300" aria-label="Not allowed" />
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