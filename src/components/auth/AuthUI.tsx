'use client';

import { useEffect, useMemo, useState } from 'react';
import { getProviders, signIn } from 'next-auth/react';
import {
    Eye,
    EyeOff,
    TrendingUp,
    Wallet,
    Sparkles,
    BarChart3,
    ArrowUpRight,
    ArrowDownLeft,
    Check,
    PiggyBank,
    ShieldCheck,
    Zap,
    type LucideIcon,
    Users,
    Activity,
    Layers,
    Lock,
    Mail,
    MailCheck,
    KeyRound,
    LockKeyhole,
} from 'lucide-react';
import { usePublicSettings } from '@/features/settings/hooks/use-settings';
import { SITE } from '@/content/marketing/site';
import { Button } from '@/components/ui/Button';
import { googleOAuthErrorMessage } from '@/lib/auth/oauth-errors';
import { getErrorMessage, notify } from '@/lib/ui/toast';

/* -------------------------------------------------------------------------- */
/*                                Small pieces                                */
/* -------------------------------------------------------------------------- */

export const iconFieldCls =
    'bg-base-200/50 border-base-300 placeholder:text-base-content/40 focus:border-primary focus:ring-primary/20 h-11 w-full rounded-lg border pr-3 pl-10 text-sm transition outline-none focus:ring-2';

/** Brand name from system settings (branding.name), falling back to the static site name. */
export function useSiteName() {
    const { data: settings } = usePublicSettings();
    return String(settings?.['branding.name'] ?? SITE.name);
}

export function AuthBrand({
    className = '',
    align = 'center',
    variant = 'default',
}: {
    className?: string;
    align?: 'left' | 'center';
    variant?: 'default' | 'light';
}) {
    const light = variant === 'light';
    const siteName = useSiteName();
    return (
        <div
            className={`flex items-center gap-2 ${
                align === 'center' ? 'justify-center' : 'justify-start'
            } ${className}`}
        >
            <span
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    light ? 'bg-white/20 backdrop-blur' : 'bg-primary text-primary-content'
                }`}
            >
                <TrendingUp className="h-4 w-4" />
            </span>
            <span className={`text-lg font-bold tracking-tight ${light ? '' : 'text-primary'}`}>
                {siteName}
            </span>
        </div>
    );
}

export function AuthAlert({ children }: { children: React.ReactNode }) {
    return (
        <div
            role="alert"
            className="bg-error/10 text-error border-error/20 mb-4 rounded-lg border p-3 text-sm"
        >
            {children}
        </div>
    );
}

function GoogleIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
            <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            />
            <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
        </svg>
    );
}

export function AuthDivider({ label = 'OR' }: { label?: string }) {
    return (
        <div className="flex items-center gap-3" role="separator">
            <span className="bg-base-300 h-px flex-1" />
            <span className="text-base-content/40 text-xs font-medium tracking-wider">{label}</span>
            <span className="bg-base-300 h-px flex-1" />
        </div>
    );
}

export function GoogleSignInButton({ onError }: { onError?: (message: string) => void }) {
    const [loading, setLoading] = useState(false);

    const handleClick = async () => {
        setLoading(true);
        try {
            const providers = await getProviders();
            if (!providers?.google) {
                const message = googleOAuthErrorMessage('Configuration');
                onError?.(message);
                notify.error(message);
                setLoading(false);
                return;
            }
            await signIn('google', { callbackUrl: '/dashboard' });
        } catch (err) {
            const message = getErrorMessage(err, 'Google sign-in failed');
            onError?.(message);
            notify.error(message);
            setLoading(false);
        }
    };

    return (
        <Button
            type="button"
            variant="secondary"
            loading={loading}
            leftIcon={<GoogleIcon />}
            onClick={handleClick}
            className="border-base-300 bg-base-100 hover:bg-base-200 w-full border shadow-sm"
        >
            Continue with Google
        </Button>
    );
}

interface AuthFieldProps {
    id: string;
    label: string;
    icon: LucideIcon;
    value: string;
    onChange: (value: string) => void;
    type?: 'text' | 'email' | 'password';
    placeholder?: string;
    autoComplete?: string;
    required?: boolean;
    /** Visually hide the label (it stays available to screen readers). */
    hideLabel?: boolean;
    /** Small uppercase label style. */
    uppercaseLabel?: boolean;
    /** Anything rendered under the input (hints, strength meter). */
    hint?: React.ReactNode;
    autoFocus?: boolean;
}

export function AuthField({
    id,
    label,
    icon: Icon,
    value,
    onChange,
    type = 'text',
    placeholder,
    autoComplete,
    required,
    hideLabel,
    uppercaseLabel,
    hint,
    autoFocus,
}: AuthFieldProps) {
    const [show, setShow] = useState(false);
    const isPassword = type === 'password';

    const labelCls = hideLabel
        ? 'sr-only'
        : uppercaseLabel
          ? 'text-base-content/70 mb-1.5 block text-xs font-semibold tracking-wide uppercase'
          : 'text-base-content/70 mb-1.5 block text-sm font-medium';

    return (
        <div>
            <label htmlFor={id} className={labelCls}>
                {label}
            </label>
            <div className="relative">
                <Icon className="text-base-content/40 pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <input
                    id={id}
                    type={isPassword && show ? 'text' : type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    required={required}
                    autoFocus={autoFocus}
                    className={`${iconFieldCls} ${isPassword ? 'pr-10' : ''}`}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShow((v) => !v)}
                        aria-label={show ? 'Hide password' : 'Show password'}
                        className="text-base-content/40 hover:text-base-content absolute top-1/2 right-3 -translate-y-1/2 transition"
                    >
                        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                )}
            </div>
            {hint}
        </div>
    );
}

export function PasswordStrength({ password }: { password: string }) {
    const score = useMemo(() => {
        if (!password) return 0;
        let s = 0;
        if (password.length >= 8) s++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) s++;
        if (/\d/.test(password)) s++;
        if (/[^A-Za-z0-9]/.test(password)) s++;
        return Math.max(s, 1);
    }, [password]);

    if (!password) return null;

    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['', 'bg-error', 'bg-warning', 'bg-info', 'bg-success'];

    return (
        <div className="mt-2" aria-live="polite">
            <div className="flex gap-1.5">
                {[1, 2, 3, 4].map((i) => (
                    <span
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                            i <= score ? colors[score] : 'bg-base-300'
                        }`}
                    />
                ))}
            </div>
            <p className="text-base-content/60 mt-1 text-xs">
                Password strength: <span className="font-medium">{labels[score]}</span>
            </p>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*                         Centered card (forgot/reset/…)                      */
/* -------------------------------------------------------------------------- */

const TONES = {
    primary: 'bg-primary/10 text-primary ring-primary/10',
    success: 'bg-success/10 text-success ring-success/10',
    error: 'bg-error/10 text-error ring-error/10',
} as const;

export function AuthCard({
    icon: Icon,
    title,
    subtitle,
    tone = 'primary',
    maxWidth = 'max-w-md',
    children,
}: {
    icon: LucideIcon;
    title: string;
    subtitle?: React.ReactNode;
    tone?: keyof typeof TONES;
    maxWidth?: string;
    children: React.ReactNode;
}) {
    return (
        <div className={`w-full ${maxWidth}`}>
            <AuthBrand className="mb-6" />
            <div className="bg-base-100 border-base-300 overflow-hidden rounded-2xl border shadow-2xl">
                <div className="from-primary to-primary/30 h-1.5 bg-gradient-to-r" />
                <div className="px-8 py-9 sm:px-10">
                    <div className="mb-7 text-center">
                        <div
                            className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ring-8 ${TONES[tone]}`}
                        >
                            <Icon className="h-6 w-6" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
                        {subtitle && (
                            <p className="text-base-content/60 mx-auto mt-1.5 max-w-xs text-sm">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*                         Split layout (login/signup)                         */
/* -------------------------------------------------------------------------- */

export function SplitAuthLayout({
    panel,
    panelSide = 'right',
    children,
}: {
    panel: React.ReactNode;
    panelSide?: 'left' | 'right';
    children: React.ReactNode;
}) {
    const panelLeft = panelSide === 'left';

    return (
        <div
            className={`bg-base-100 border-base-300 grid min-h-[620px] w-full max-w-5xl overflow-hidden rounded-2xl border shadow-2xl ${
                panelLeft ? 'lg:grid-cols-[5fr_6fr]' : 'lg:grid-cols-2'
            }`}
        >
            {panelLeft && panel}
            <div className="flex items-center justify-center px-6 py-10 sm:px-12">
                <div className="w-full max-w-sm">
                    {/* Panel side: on the left the panel already shows the logo on desktop */}
                    <AuthBrand align="left" className={panelLeft ? 'mb-6 lg:hidden' : 'mb-10'} />
                    {children}
                </div>
            </div>
            {!panelLeft && panel}
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*                      Login panel: slides + illustration                     */
/* -------------------------------------------------------------------------- */

const SLIDES = [
    {
        title: 'Every transaction, in one place.',
        text: 'Track income and expenses across all your accounts in a single dashboard.',
    },
    {
        title: 'Let AI do the heavy lifting.',
        text: 'Smart categorisation and insights that help you understand your cashflow.',
    },
    {
        title: 'Stay on top of your budgets.',
        text: 'Set budgets, automate recurring entries, and see where your money goes.',
    },
];

export function ShowcasePanel() {
    const [active, setActive] = useState(0);

    useEffect(() => {
        const id = setInterval(() => setActive((i) => (i + 1) % SLIDES.length), 5000);
        return () => clearInterval(id);
    }, []);

    return (
        <div className="bg-primary text-primary-content relative hidden flex-col items-center justify-between overflow-hidden px-10 py-12 lg:flex">
            <div className="flex flex-1 items-center justify-center">
                <Illustration />
            </div>

            <div className="text-center">
                <h3 className="text-xl font-semibold">{SLIDES[active].title}</h3>
                <p className="text-primary-content/80 mx-auto mt-2 max-w-xs text-sm">
                    {SLIDES[active].text}
                </p>
                <div className="mt-6 flex items-center justify-center gap-2">
                    {SLIDES.map((_, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => setActive(i)}
                            aria-label={`Show slide ${i + 1}`}
                            className={`h-1.5 rounded-full transition-all ${
                                i === active ? 'w-4 bg-white' : 'w-1.5 bg-white/40'
                            }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

function Illustration() {
    const nodes = [
        { Icon: Wallet, top: 22, primary: false },
        { Icon: Sparkles, top: 132, primary: true },
        { Icon: BarChart3, top: 242, primary: false },
    ];

    const rows = [
        { Icon: ArrowDownLeft, color: 'text-success bg-success/10', w: 'w-24' },
        { Icon: ArrowUpRight, color: 'text-error bg-error/10', w: 'w-20' },
        { Icon: ArrowUpRight, color: 'text-error bg-error/10', w: 'w-28' },
    ];

    return (
        <div className="relative h-[320px] w-[440px] scale-90 xl:scale-100">
            <svg
                viewBox="0 0 440 320"
                className="absolute inset-0 h-full w-full"
                fill="none"
                aria-hidden="true"
            >
                <circle cx="200" cy="160" r="150" fill="white" fillOpacity="0.08" />
                <path
                    d="M68 50 H130 V270 H68 M130 160 H210"
                    stroke="white"
                    strokeOpacity="0.2"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>

            {nodes.map(({ Icon, top, primary }, i) => (
                <div
                    key={i}
                    className="absolute left-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/30 p-1.5"
                    style={{ top }}
                >
                    <div
                        className={`flex h-full w-full items-center justify-center rounded-full shadow-md ${
                            primary ? 'bg-primary text-primary-content' : 'bg-base-100 text-primary'
                        }`}
                    >
                        <Icon className="h-5 w-5" />
                    </div>
                </div>
            ))}

            <div className="bg-base-100 text-base-content absolute top-[40px] right-0 w-[230px] overflow-hidden rounded-xl shadow-xl">
                <div className="flex items-center gap-1.5 px-3 py-2.5">
                    <span className="bg-error h-2 w-2 rounded-full" />
                    <span className="bg-warning h-2 w-2 rounded-full" />
                    <span className="bg-success h-2 w-2 rounded-full" />
                    <span className="bg-base-300 ml-auto h-1.5 w-14 rounded-full" />
                </div>
                <div className="bg-base-200/60 space-y-2 p-3">
                    {rows.map(({ Icon, color, w }, i) => (
                        <div
                            key={i}
                            className="bg-base-100 border-base-300 flex items-center gap-2.5 rounded-lg border p-2"
                        >
                            <span
                                className={`flex h-7 w-7 items-center justify-center rounded-full ${color}`}
                            >
                                <Icon className="h-3.5 w-3.5" />
                            </span>
                            <div className="space-y-1.5">
                                <div className={`bg-base-300 h-1.5 rounded-full ${w}`} />
                                <div className="bg-base-200 h-1.5 w-14 rounded-full" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*                   Signup panel: benefits + floating cards                   */
/* -------------------------------------------------------------------------- */

const FEATURES = [
    { Icon: Zap, text: 'Set up in under a minute' },
    { Icon: Sparkles, text: 'AI-powered insights on your cashflow' },
    { Icon: PiggyBank, text: 'Budgets and recurring entries, automated' },
    { Icon: ShieldCheck, text: 'Your data stays private and secure' },
];

export function BenefitsPanel() {
    return (
        <div className="from-primary to-primary/70 text-primary-content relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br px-10 py-12 lg:flex">
            <svg
                className="absolute inset-0 h-full w-full opacity-20"
                aria-hidden="true"
                fill="none"
            >
                <defs>
                    <pattern id="auth-dots" width="22" height="22" patternUnits="userSpaceOnUse">
                        <circle cx="2" cy="2" r="1.4" fill="white" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#auth-dots)" />
            </svg>
            <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-black/10 blur-3xl" />

            <div className="relative">
                <AuthBrand align="left" variant="light" className="mb-10" />

                <h3 className="text-3xl leading-tight font-bold tracking-tight">
                    Know where your money goes, before it goes.
                </h3>

                <ul className="mt-8 space-y-4">
                    {FEATURES.map(({ Icon, text }) => (
                        <li key={text} className="flex items-center gap-3 text-sm">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15">
                                <Icon className="h-4 w-4" />
                            </span>
                            <span className="text-primary-content/90">{text}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <FloatingCards />
        </div>
    );
}

function FloatingCards() {
    const budgets = [
        { label: 'Groceries', pct: 62 },
        { label: 'Transport', pct: 38 },
        { label: 'Savings', pct: 85 },
    ];

    return (
        <div className="relative mt-10 h-[190px]">
            <div className="bg-base-100 text-base-content absolute top-0 left-0 w-[230px] rotate-[-3deg] rounded-xl p-4 shadow-xl">
                <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold">Monthly budgets</span>
                    <span className="bg-success/15 text-success rounded-full px-2 py-0.5 text-[10px] font-medium">
                        On track
                    </span>
                </div>
                <div className="space-y-2.5">
                    {budgets.map(({ label, pct }) => (
                        <div key={label}>
                            <div className="text-base-content/60 mb-1 flex justify-between text-[10px]">
                                <span>{label}</span>
                                <span>{pct}%</span>
                            </div>
                            <div className="bg-base-200 h-1.5 overflow-hidden rounded-full">
                                <div
                                    className="bg-primary h-full rounded-full"
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-base-100 text-base-content absolute right-0 bottom-0 flex w-[210px] rotate-[2deg] items-center gap-3 rounded-xl p-3 shadow-xl">
                <span className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
                    <Sparkles className="h-4 w-4" />
                </span>
                <div>
                    <p className="text-xs font-semibold">AI insight</p>
                    <p className="text-base-content/60 text-[10px] leading-snug">
                        You could save more by trimming dining out.
                    </p>
                </div>
                <span className="bg-success text-success-content absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full shadow">
                    <Check className="h-3 w-3" />
                </span>
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*                 Admin panel: clickable stats + live bar chart               */
/* -------------------------------------------------------------------------- */

const ADMIN_STATS = [
    { Icon: Users, label: 'Users', value: '1,284', trend: '+12%' },
    { Icon: Layers, label: 'Workspaces', value: '342', trend: '+4%' },
    { Icon: Activity, label: 'Audit events', value: '9.7k', trend: '+21%' },
];

const ADMIN_SERIES = [
    [40, 55, 48, 62, 58, 70, 66, 78, 72, 85, 80, 92],
    [30, 34, 42, 38, 50, 47, 58, 55, 63, 70, 68, 76],
    [55, 40, 72, 60, 88, 64, 95, 70, 82, 60, 90, 75],
];

export function AdminPanel() {
    const [active, setActive] = useState(0);

    useEffect(() => {
        const id = setInterval(() => setActive((i) => (i + 1) % ADMIN_STATS.length), 4000);
        return () => clearInterval(id);
    }, []);

    return (
        <div className="from-primary to-primary/70 text-primary-content relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br px-10 py-12 lg:flex">
            {/* dot grid + glow (same as the signup panel) */}
            <svg
                className="absolute inset-0 h-full w-full opacity-20"
                aria-hidden="true"
                fill="none"
            >
                <defs>
                    <pattern id="admin-dots" width="22" height="22" patternUnits="userSpaceOnUse">
                        <circle cx="2" cy="2" r="1.4" fill="white" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#admin-dots)" />
            </svg>
            <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-black/10 blur-3xl" />

            <div className="relative">
                <AuthBrand align="left" variant="light" className="mb-10" />
                <h3 className="text-3xl leading-tight font-bold tracking-tight">
                    Everything on the platform, at a glance.
                </h3>
                <p className="text-primary-content/80 mt-3 max-w-xs text-sm">
                    Manage users and workspaces, and keep an eye on activity from one place.
                </p>
            </div>

            <div className="relative mt-10">
                <div className="grid grid-cols-3 gap-3">
                    {ADMIN_STATS.map(({ Icon, label, value, trend }, i) => {
                        const on = i === active;
                        return (
                            <button
                                key={label}
                                type="button"
                                onClick={() => setActive(i)}
                                className={`rounded-xl p-3 text-left transition-all duration-300 ${
                                    on
                                        ? 'bg-base-100 text-base-content -translate-y-1 shadow-xl'
                                        : 'bg-white/15 backdrop-blur hover:-translate-y-0.5 hover:bg-white/25'
                                }`}
                            >
                                <span
                                    className={`mb-3 flex h-7 w-7 items-center justify-center rounded-full ${
                                        on ? 'bg-primary/10 text-primary' : 'bg-white/20'
                                    }`}
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                </span>
                                <p className="text-lg leading-none font-bold">{value}</p>
                                <p
                                    className={`mt-1 text-[11px] ${
                                        on ? 'text-base-content/60' : 'text-primary-content/80'
                                    }`}
                                >
                                    {label}
                                </p>
                                <span
                                    className={`mt-2 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                                        on ? 'bg-success/15 text-success' : 'bg-white/20'
                                    }`}
                                >
                                    {trend}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="bg-base-100 text-base-content mt-4 rounded-xl p-4 shadow-xl">
                    <div className="mb-3 flex items-center justify-between text-xs">
                        <span className="font-semibold">
                            {ADMIN_STATS[active].label} · last 12 weeks
                        </span>
                        <span className="text-base-content/50">Sample data</span>
                    </div>
                    <div className="flex h-24 items-end gap-1.5">
                        {ADMIN_SERIES[active].map((h, i) => (
                            <span
                                key={i}
                                className="bg-primary/80 flex-1 rounded-t transition-all duration-500"
                                style={{ height: `${h}%` }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="text-primary-content/80 relative mt-8 flex items-center gap-2 text-xs">
                <Lock className="h-3.5 w-3.5" />
                Restricted area. All actions are audit logged.
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*                 Recovery panel: animated icon + step tracker                */
/* -------------------------------------------------------------------------- */

const RECOVERY_STEPS = [
    { Icon: Mail, title: 'Enter your email', text: "We'll look up your account." },
    { Icon: MailCheck, title: 'Check your inbox', text: 'Open the reset link we send you.' },
    { Icon: KeyRound, title: 'Set a new password', text: "Pick a strong one and you're back in." },
];

export function RecoveryPanel({
    step = 0,
    showBrand = false,
}: {
    step?: 0 | 1 | 2;
    showBrand?: boolean;
}) {
    const CurrentIcon = RECOVERY_STEPS[step].Icon;

    return (
        <div className="from-primary to-primary/70 text-primary-content relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br px-10 py-12 lg:flex">
            <svg
                className="absolute inset-0 h-full w-full opacity-20"
                aria-hidden="true"
                fill="none"
            >
                <defs>
                    <pattern
                        id="recovery-dots"
                        width="22"
                        height="22"
                        patternUnits="userSpaceOnUse"
                    >
                        <circle cx="2" cy="2" r="1.4" fill="white" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#recovery-dots)" />
            </svg>
            <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

            <div className="relative">
                {showBrand && <AuthBrand align="left" variant="light" className="mb-8" />}

                {/* animated icon */}
                <div className="relative mx-auto my-6 flex h-40 w-40 items-center justify-center">
                    <span className="absolute inset-0 rounded-full bg-white/10" />
                    <span className="absolute inset-4 rounded-full bg-white/10" />
                    <span className="absolute inset-8 animate-ping rounded-full bg-white/20" />
                    <span className="bg-base-100 text-primary relative flex h-20 w-20 items-center justify-center rounded-full shadow-xl">
                        <CurrentIcon className="h-9 w-9" />
                    </span>
                </div>

                <h3 className="text-center text-2xl font-bold tracking-tight">
                    Locked out? It happens.
                </h3>
                <p className="text-primary-content/80 mx-auto mt-2 max-w-xs text-center text-sm">
                    Three quick steps and you&apos;re back on your dashboard.
                </p>
            </div>

            <ol className="relative mt-8 space-y-3">
                {RECOVERY_STEPS.map(({ Icon, title, text }, i) => {
                    const done = i < step;
                    const current = i === step;
                    return (
                        <li
                            key={title}
                            className={`flex items-center gap-3 rounded-xl p-3 transition-all duration-300 ${
                                current
                                    ? 'bg-white/20 shadow-lg backdrop-blur'
                                    : 'hover:bg-white/10'
                            } ${!current && !done ? 'opacity-60' : ''}`}
                        >
                            <span
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                                    done
                                        ? 'bg-success text-success-content'
                                        : current
                                          ? 'bg-base-100 text-primary'
                                          : 'bg-white/15'
                                }`}
                            >
                                {done ? (
                                    <Check className="h-4 w-4" />
                                ) : (
                                    <Icon className="h-4 w-4" />
                                )}
                            </span>
                            <div>
                                <p className="text-sm font-semibold">{title}</p>
                                <p className="text-primary-content/75 text-xs">{text}</p>
                            </div>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*                Reset panel: live password requirements list                 */
/* -------------------------------------------------------------------------- */

export function PasswordChecklistPanel({
    password,
    minLength = 8,
    showBrand = true,
}: {
    password: string;
    minLength?: number;
    showBrand?: boolean;
}) {
    const rules = [
        { label: `At least ${minLength} characters`, ok: password.length >= minLength },
        {
            label: 'Upper and lowercase letters',
            ok: /[a-z]/.test(password) && /[A-Z]/.test(password),
        },
        { label: 'At least one number', ok: /\d/.test(password) },
        { label: 'At least one special character', ok: /[^A-Za-z0-9]/.test(password) },
    ];
    const passed = rules.filter((r) => r.ok).length;
    const allOk = passed === rules.length;
    const Icon = allOk ? ShieldCheck : LockKeyhole;

    return (
        <div className="from-primary to-primary/70 text-primary-content relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br px-10 py-12 lg:flex">
            <svg
                className="absolute inset-0 h-full w-full opacity-20"
                aria-hidden="true"
                fill="none"
            >
                <defs>
                    <pattern
                        id="checklist-dots"
                        width="22"
                        height="22"
                        patternUnits="userSpaceOnUse"
                    >
                        <circle cx="2" cy="2" r="1.4" fill="white" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#checklist-dots)" />
            </svg>
            <div className="pointer-events-none absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-black/10 blur-3xl" />

            <div className="relative">
                {showBrand && <AuthBrand align="left" variant="light" className="mb-8" />}

                <div className="relative mx-auto my-6 flex h-28 w-28 items-center justify-center">
                    <span
                        className={`absolute inset-0 rounded-full transition-colors duration-500 ${
                            allOk ? 'bg-success/30' : 'bg-white/10'
                        }`}
                    />
                    <span className="bg-base-100 text-primary relative flex h-16 w-16 items-center justify-center rounded-full shadow-xl">
                        <Icon
                            className={`h-7 w-7 transition-colors ${allOk ? 'text-success' : ''}`}
                        />
                    </span>
                </div>

                <h3 className="text-center text-2xl font-bold tracking-tight">
                    {allOk ? 'Looking strong!' : 'Make it hard to guess.'}
                </h3>
                <p className="text-primary-content/80 mx-auto mt-2 max-w-xs text-center text-sm">
                    {passed} of {rules.length} requirements met
                </p>

                <div className="mx-auto mt-4 h-1.5 max-w-xs overflow-hidden rounded-full bg-white/20">
                    <div
                        className="h-full rounded-full bg-white transition-all duration-500"
                        style={{ width: `${(passed / rules.length) * 100}%` }}
                    />
                </div>
            </div>

            <ul className="relative mt-8 space-y-2.5">
                {rules.map(({ label, ok }) => (
                    <li
                        key={label}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-300 ${
                            ok ? 'bg-white/20' : 'bg-white/5'
                        }`}
                    >
                        <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors ${
                                ok ? 'bg-success text-success-content' : 'bg-white/15'
                            }`}
                        >
                            {ok && <Check className="h-3.5 w-3.5" />}
                        </span>
                        <span className={ok ? '' : 'text-primary-content/75'}>{label}</span>
                    </li>
                ))}
            </ul>

            <div className="relative mt-6 flex items-start gap-3 rounded-xl bg-white/10 p-3 text-xs">
                <KeyRound className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="text-primary-content/85">
                    Tip: a passphrase of three or four random words is easy to remember and hard to
                    crack.
                </p>
            </div>
        </div>
    );
}
