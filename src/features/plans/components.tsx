'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Crown, Lock } from 'lucide-react';
import { Button, PrimaryButton, type ButtonProps } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
    PLAN_FEATURES, PLAN_LABELS, PLAN_LIMITS,
    type PlanFeatureKey, type PlanId, type PlanLimitKey,
} from '@/lib/plans/constants';
import { UPGRADE_EVENT, requestUpgrade } from '@/lib/plans/upgrade-event';
import { useLimit, usePlan } from './hooks/use-plan';

export function PlanBadge({ plan }: { plan: PlanId }) {
    const premium = plan === 'PREMIUM';
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
                premium
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-base-300 bg-base-200 text-base-content/70'
            }`}
        >
            {premium && <Crown className="h-3 w-3" />}
            {PLAN_LABELS[plan]}
        </span>
    );
}

export function UsageMeter({ limitKey, label }: { limitKey: PlanLimitKey; label?: string }) {
    const { limit, used, unlimited, isLoading } = useLimit(limitKey);
    if (isLoading) return <div className="bg-base-200 h-4 w-32 animate-pulse rounded" />;
    const pct = unlimited ? 0 : Math.min(100, Math.round((used / Math.max(limit, 1)) * 100));
    return (
        <div className="min-w-0 space-y-1">
            <p className="text-base-content/60 text-xs">
                {label ?? PLAN_LIMITS[limitKey]}:{' '}
                <span className="text-base-content font-medium">
                    {used} / {unlimited ? '∞' : limit}
                </span>
            </p>
            {!unlimited && (
                <div className="bg-base-200 h-1.5 w-full rounded-full">
                    <div
                        className={`h-1.5 rounded-full ${pct >= 100 ? 'bg-error' : 'bg-primary'}`}
                        style={{ width: `${pct}%` }}
                    />
                </div>
            )}
        </div>
    );
}

/** Real, clickable button. When locked it opens the upgrade prompt instead of acting. */
export function LockedButton({
    locked,
    lockedMessage,
    onClick,
    leftIcon,
    children,
    ...rest
}: ButtonProps & { locked: boolean; lockedMessage?: string }) {
    return (
        <Button
            {...rest}
            leftIcon={locked ? <Lock className="h-4 w-4" /> : leftIcon}
            onClick={locked ? () => requestUpgrade(lockedMessage) : onClick}
        >
            {children}
        </Button>
    );
}

/** Wrap a whole section or page. Shows a skeleton while the plan loads, so nothing fires early. */
export function PlanGate({
    feature,
    children,
}: {
    feature: PlanFeatureKey;
    children: React.ReactNode;
}) {
    const { data, isLoading } = usePlan();
    if (isLoading || !data) return <div className="bg-base-200 h-40 animate-pulse rounded-xl" />;
    if (data.features[feature]) return <>{children}</>;
    return (
        <div className="border-base-300 bg-base-100 rounded-xl border border-dashed p-10 text-center">
            <Lock className="text-base-content/40 mx-auto h-6 w-6" />
            <p className="text-base-content mt-2 text-sm font-medium">
                {PLAN_FEATURES[feature]} is a Premium feature.
            </p>
            <Link href="/dashboard/upgrade">
                <Button className="mt-3">Upgrade</Button>
            </Link>
        </div>
    );
}

/** Mount ONCE (in DashboardShell). Any requestUpgrade() call or PLAN_* API error opens it. */
export function PlanUpgradeListener() {
    const [message, setMessage] = useState<string | null>(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const handler = (e: Event) => {
            setMessage((e as CustomEvent<{ message?: string }>).detail?.message ?? null);
            setOpen(true);
        };
        window.addEventListener(UPGRADE_EVENT, handler);
        return () => window.removeEventListener(UPGRADE_EVENT, handler);
    }, []);

    const close = () => setOpen(false);
    return (
        <Modal
            open={open}
            onClose={close}
            title="Upgrade to unlock this"
            footer={
                <>
                    <Button variant="secondary" onClick={close}>
                        Not now
                    </Button>
                    <Link href="/dashboard/upgrade" onClick={close}>
                        <PrimaryButton>See plans</PrimaryButton>
                    </Link>
                </>
            }
        >
            <p className="text-base-content/70 text-sm">
                {message ?? 'This is not included in your current plan.'}
            </p>
        </Modal>
    );
}