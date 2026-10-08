'use client';

import { memo } from 'react';
import Link from 'next/link';
import { AlertTriangle, CircleAlert, Info } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { NotificationDTO, NotificationSeverity } from '../types';

const SEVERITY_STYLE: Record<NotificationSeverity, { icon: typeof Info; box: string }> = {
    critical: { icon: CircleAlert, box: 'bg-error/10 text-error' },
    warning: { icon: AlertTriangle, box: 'bg-warning/10 text-warning' },
    info: { icon: Info, box: 'bg-info/10 text-info' },
};

export const NotificationRow = memo(function NotificationRow({ item }: { item: NotificationDTO }) {
    const { icon: Icon, box } = SEVERITY_STYLE[item.severity];
    return (
        <Link href={item.href} className="flex min-w-0 items-center gap-3">
            <span
                className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', box)}
            >
                <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
                <span
                    className={cn(
                        'text-base-content flex items-center gap-2 text-sm',
                        item.isRead ? 'font-normal' : 'font-semibold',
                    )}
                >
                    <span className="truncate">{item.title}</span>
                    {!item.isRead && (
                        <span
                            className="bg-primary h-2 w-2 shrink-0 rounded-full"
                            aria-label="Unread"
                        />
                    )}
                </span>
                <span className="text-base-content/60 block truncate text-xs">
                    {item.description}
                </span>
            </span>
        </Link>
    );
});
