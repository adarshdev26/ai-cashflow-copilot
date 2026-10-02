'use client';

import { useState } from 'react';
import { useCurrentUser } from '@/features/auth';
import { useUpdateProfile } from '@/features/auth/hooks/use-update-profile';
import { notify, getErrorMessage } from '@/lib/toast';
import { ChangePasswordSection } from './ChangePasswordSection';
import { settingsInputCls } from '@/components/ui/inputs';

const card = 'bg-base-100 rounded-xl shadow-sm border border-base-300 p-4 sm:p-6 space-y-4';

export function ProfileTab() {
  const { data: user, isLoading } = useCurrentUser();

  return (
    <div className="space-y-6" data-tour="settings-profile">
      <section className={card}>
        <h2 className="text-lg font-semibold text-base-content">Profile</h2>
        {isLoading || !user ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="h-16 animate-pulse rounded-md bg-base-200" />
            <div className="h-16 animate-pulse rounded-md bg-base-200" />
          </div>
        ) : (
          <ProfileForm key={user.id} initialName={user.name ?? ''} email={user.email} />
        )}
      </section>

      <ChangePasswordSection />
    </div>
  );
}

function ProfileForm({ initialName, email }: { initialName: string; email: string }) {
  const [name, setName] = useState(initialName);
  const { mutate, isPending } = useUpdateProfile();
  const trimmed = name.trim();
  const unchanged = !trimmed || trimmed === initialName;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (unchanged) return;
    mutate(
      { name: trimmed },
      {
        onSuccess: () => notify.success('Profile updated'),
        onError: (err) => notify.error(getErrorMessage(err, 'Failed to update profile')),
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="profile-name" className="mb-1 block text-sm font-medium text-base-content/70">Name</label>
          <input
            id="profile-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            disabled={isPending}
            className={settingsInputCls}
          />
        </div>
        <div>
          <label htmlFor="profile-email" className="mb-1 block text-sm font-medium text-base-content/70">Email</label>
          <input id="profile-email" type="email" value={email} disabled className={settingsInputCls} />
          <p className="mt-1 text-xs text-base-content/50">Email can&apos;t be changed yet.</p>
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={isPending || unchanged} className="btn btn-primary btn-sm">
          {isPending ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}
