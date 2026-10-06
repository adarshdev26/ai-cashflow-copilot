'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { LayoutGrid, LogOut, type LucideIcon } from 'lucide-react';

export type MobileTabItem = {
    name: string;
    href: string;
    icon: LucideIcon;
    exact?: boolean;
};

type Props = {
    items: MobileTabItem[]; // bottom tabs
    moreItems: MobileTabItem[]; // shown in the floating "More" menu
    user?: { name: string; email?: string | null };
    onSignOut: () => void;
};

export function MobileTabBar({ items, moreItems, user, onSignOut }: Props) {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const [prevPathname, setPrevPathname] = useState(pathname);

    // Close the menu when the route changes.
    if (prevPathname !== pathname) {
        setPrevPathname(pathname);
        setOpen(false);
    }

    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [open]);

    const isActive = (item: MobileTabItem) =>
        item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

    const moreActive = open || moreItems.some(isActive);

    return (
        <nav
            aria-label="Primary"
            className="border-base-300 bg-base-100 relative shrink-0 border-t pb-[env(safe-area-inset-bottom)] md:hidden"
        >
            {open && (
                <>
                    <div
                        className="fixed inset-0 z-30 bg-black/20"
                        onClick={() => setOpen(false)}
                        aria-hidden="true"
                    />
                    <div
                        role="menu"
                        className="border-base-300 bg-base-100 absolute right-2 bottom-full z-40 mb-2 w-64 overflow-hidden rounded-2xl border shadow-xl"
                    >
                        {user && (
                            <div className="border-base-200 flex items-center gap-3 border-b px-4 py-3">
                                <div className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-base-content truncate text-sm font-medium">
                                        {user.name}
                                    </p>
                                    {user.email && (
                                        <p className="text-base-content/60 truncate text-xs">
                                            {user.email}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        <ul className="max-h-[50vh] overflow-y-auto p-2">
                            {moreItems.map((item) => {
                                const active = isActive(item);
                                const Icon = item.icon;
                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            role="menuitem"
                                            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                                                active
                                                    ? 'bg-primary/10 text-primary'
                                                    : 'text-base-content/80 hover:bg-base-200'
                                            }`}
                                        >
                                            <Icon
                                                className={`h-4 w-4 shrink-0 ${active ? 'text-primary' : 'text-base-content/50'}`}
                                            />
                                            {item.name}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>

                        <div className="border-base-200 border-t p-2">
                            <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                    setOpen(false);
                                    onSignOut();
                                }}
                                className="text-error hover:bg-error/10 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                            >
                                <LogOut className="h-4 w-4 shrink-0" />
                                Sign out
                            </button>
                        </div>
                    </div>
                </>
            )}

            <ul className="grid" style={{ gridTemplateColumns: `repeat(${items.length + 1}, 1fr)` }}>
                {items.map((item) => {
                    const active = isActive(item);
                    const Icon = item.icon;
                    return (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                aria-current={active ? 'page' : undefined}
                                className={`flex h-14 flex-col items-center justify-center gap-0.5 transition-colors ${
                                    active ? 'text-primary' : 'text-base-content/60'
                                }`}
                            >
                                <span
                                    className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${
                                        active ? 'bg-primary/10' : ''
                                    }`}
                                >
                                    <Icon className="h-5 w-5" />
                                </span>
                                <span className="max-w-full truncate px-1 text-[10px] leading-none font-medium">
                                    {item.name}
                                </span>
                            </Link>
                        </li>
                    );
                })}
                <li>
                    <button
                        type="button"
                        aria-haspopup="menu"
                        aria-expanded={open}
                        onClick={() => setOpen((o) => !o)}
                        className={`relative z-40 flex h-14 w-full flex-col items-center justify-center gap-0.5 transition-colors ${
                            moreActive ? 'text-primary' : 'text-base-content/60'
                        }`}
                    >
                        <span
                            className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${
                                moreActive ? 'bg-primary/10' : ''
                            }`}
                        >
                            <LayoutGrid className="h-5 w-5" />
                        </span>
                        <span className="text-[10px] leading-none font-medium">More</span>
                    </button>
                </li>
            </ul>
        </nav>
    );
}