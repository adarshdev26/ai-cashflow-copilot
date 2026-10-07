'use client';

import { Select } from '@/components/ui/Select';
import type { SelectProps } from '@/components/ui/Select';
import { cn } from '@/lib/cn';

export function FilterSelect({ className, ...props }: SelectProps) {
    const hasCustomWidth = className?.split(/\s+/).some((token) => /^!?w-/.test(token));
    return <Select className={cn(hasCustomWidth ? undefined : 'w-36 sm:w-40', className)} {...props} />;
}
