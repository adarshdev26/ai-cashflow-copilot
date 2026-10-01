'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function MobileMenu({ links }: { links: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="rounded-md p-2 hover:bg-mk-surface"
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-16 border-b border-mk-line bg-mk-bg p-4 shadow-lg">
          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="rounded-md px-3 py-3 font-medium hover:bg-mk-surface">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link href="/login" className="rounded-lg border border-mk-line py-3 text-center font-semibold">
              Log in
            </Link>
            <Link href="/signup" className="rounded-lg bg-mk-brand py-3 text-center font-semibold text-mk-brand-fg">
              Get started
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}