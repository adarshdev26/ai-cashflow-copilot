import { Check, X } from 'lucide-react';
import { Button, PrimaryButton } from '@/components/ui/Button';
import { useCurrentUser } from '@/features/auth';
import { PlanBadge, useChangePlan, usePlan } from '@/features/plans';
import {
    PLAN_FEATURES, PLAN_IDS, PLAN_LABELS, PLAN_LIMITS, isUnlimited,
    type PlanFeatureKey, type PlanId, type PlanLimitKey,
} from '@/lib/plans/constants';
import { getErrorMessage, notify } from '@/lib/ui/toast';

const limitKeys = Object.keys(PLAN_LIMITS) as PlanLimitKey[];
const featureKeys = Object.keys(PLAN_FEATURES) as PlanFeatureKey[];

export default function UpgradePage() {
    const { data, isLoading } = usePlan();
    const { data: user } = useCurrentUser();
    const change = useChangePlan();
    const impersonating = Boolean(user?.impersonating);

    const run = async (plan: PlanId) => {
        try {
            await change.mutateAsync(plan);
            notify.success(plan === 'PREMIUM' ? 'You are now on Premium' : 'Switched to Free');
        } catch (err) {
            notify.error(getErrorMessage(err, 'Could not change plan'));
        }
    };

    if (isLoading || !data) return <div className="bg-base-200 h-64 animate-pulse rounded-xl" />;

    return (
        <div className="mx-auto max-w-4xl space-y-8">
            <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-base-content text-2xl font-bold tracking-tight">Plans</h1>
                <PlanBadge plan={data.plan} />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
                {PLAN_IDS.map((p) => {
                    const cfg = data.catalog[p];
                    const current = data.plan === p;
                    return (
                        <div
                            key={p}
                            className={`bg-base-100 rounded-xl border p-5 shadow-sm ${
                                current ? 'border-primary' : 'border-base-300'
                            }`}
                        >
                            <p className="text-base-content text-lg font-semibold">{PLAN_LABELS[p]}</p>
                            <ul className="mt-4 space-y-2 text-sm">
                                {limitKeys.map((k) => (
                                    <li key={k} className="flex justify-between gap-3">
                                        <span className="text-base-content/70">{PLAN_LIMITS[k]}</span>
                                        <span className="text-base-content font-medium">
                                            {isUnlimited(cfg.limits[k]) ? 'Unlimited' : cfg.limits[k]}
                                        </span>
                                    </li>
                                ))}
                                {featureKeys.map((k) => (
                                    <li key={k} className="flex justify-between gap-3">
                                        <span className="text-base-content/70">{PLAN_FEATURES[k]}</span>
                                        {cfg.features[k] ? (
                                            <Check className="text-success h-4 w-4" />
                                        ) : (
                                            <X className="text-base-content/40 h-4 w-4" />
                                        )}
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-5">
                                {current ? (
                                    <p className="text-base-content/60 text-sm">Your current plan</p>
                                ) : p === 'PREMIUM' ? (
                                    <PrimaryButton
                                        onClick={() => void run('PREMIUM')}
                                        loading={change.isPending}
                                        disabled={impersonating}
                                    >
                                        Upgrade to Premium
                                    </PrimaryButton>
                                ) : (
                                    <Button
                                        variant="secondary"
                                        onClick={() => void run('FREEMIUM')}
                                        disabled={change.isPending || impersonating}
                                    >
                                        Switch to Free
                                    </Button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            <p className="text-base-content/50 text-xs">Demo billing: no real payment is taken.</p>
        </div>
    );
}