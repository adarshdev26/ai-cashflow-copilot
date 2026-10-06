'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function RevealObserver() {
    const pathname = usePathname();

    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const io = new IntersectionObserver(
            (entries) => {
                for (const e of entries) {
                    if (e.isIntersecting) {
                        e.target.classList.add('mk-in');
                        io.unobserve(e.target);
                    }
                }
            },
            { rootMargin: '0px 0px -8% 0px', threshold: 0.1 },
        );

        document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
            // Skip anything already on screen so the hero never flashes.
            if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;
            el.classList.add('mk-pre');
            io.observe(el);
        });

        return () => io.disconnect();
    }, [pathname]);

    return null;
}
