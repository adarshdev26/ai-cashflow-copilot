'use client';

import { useEffect, useRef, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { notify } from '@/lib/toast';
import { buildInviteUrl } from '../utils';

/** Held in memory only: the raw token is never stored or returned again. */
export type IssuedInvitationLink = {
  email: string;
  token: string;
  expiresAt: string;
};

type Props = {
  /** The link to show. The modal is open while this is set. */
  link: IssuedInvitationLink | null;
  onDismiss: () => void;
};

export function InvitationLinkCard({ link, onDismiss }: Props) {
  // Track which token was copied, so the "Copied" state resets by itself for a new link.
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const url = link ? buildInviteUrl(link.token) : '';
  const copied = !!link && copiedToken === link.token;

  const handleCopy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedToken(link.token);
      notify.success('Invite link copied');
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopiedToken(null), 2000);
    } catch {
      inputRef.current?.select();
      notify.error('Could not copy automatically. Select the link and copy it.');
    }
  };

  return (
    <Modal
      open={!!link}
      onClose={onDismiss}
      title={link ? `Invite link for ${link.email}` : 'Invite link'}
      description="Send this link to them yourself. It is shown only once and works for one person."
      footer={
        <Button variant="primary" onClick={onDismiss}>
          Done
        </Button>
      }
    >
      {link && (
        <div className="mt-4 space-y-3">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              readOnly
              value={url}
              onFocus={(e) => e.currentTarget.select()}
              aria-label="Invitation link"
              className="flex-1 min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <Button variant="secondary" onClick={handleCopy}>
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <p className="text-xs text-slate-500">
            Link expires in 48 hours ({new Date(link.expiresAt).toLocaleString()}).
          </p>
        </div>
      )}
    </Modal>
  );
}