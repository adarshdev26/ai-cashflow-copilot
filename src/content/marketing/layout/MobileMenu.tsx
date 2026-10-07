'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { ThemeMenu } from '@/components/ui/ThemePicker';

export function MobileMenu({
    links,
    isLoggedIn = false,
    siteName,
    signupEnabled,
}: {
    links: { href: string; label: string }[];
    isLoggedIn?: boolean;
    siteName: string;
    signupEnabled: boolean;
}) {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const [prevPathname, setPrevPathname] = useState(pathname);

    // Adjust state during render when the route changes — no effect required.
    // React will re-render immediately and discard the previous output.
    if (prevPathname !== pathname) {
        setPrevPathname(pathname);
        setOpen(false);
    }

    return (
        <div className="flex items-center gap-1 md:hidden">
            <ThemeMenu />
            <button
                type="button"
                aria-label={open ? 'Close menu' : 'Open menu'}
                aria-expanded={open}
                onClick={() => setOpen((o) => !o)}
                className="hover:bg-mk-surface rounded-md p-2"
            >
                {open ? <X size={22} /> : <Menu size={22} />}
            </button>

            {open && (
                <div className="border-mk-line bg-mk-bg absolute inset-x-0 top-16 border-b p-4 shadow-lg">
                    <nav className="flex flex-col gap-1">
                        {links.map((l) => (
                            <Link
                                key={l.href}
                                href={l.href}
                                className="hover:bg-mk-surface rounded-md px-3 py-3 font-medium"
                            >
                                {l.label}
                            </Link>
                        ))}
                    </nav>

                    {isLoggedIn ? (
                        <Link
                            href="/dashboard"
                            className="bg-mk-brand text-mk-brand-fg mt-4 block rounded-lg py-3 text-center font-semibold"
                        >
                            Open {siteName}
                        </Link>
                    ) : (
                        <div className="mt-4 grid grid-cols-2 gap-2">
                            <Link
                                href="/login"
                                className="border-mk-line rounded-lg border py-3 text-center font-semibold"
                            >
                                Log in
                            </Link>
                            {signupEnabled && (
                                <Link
                                    href="/signup"
                                    className="bg-mk-brand text-mk-brand-fg rounded-lg py-3 text-center font-semibold"
                                >
                                    Get started
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
