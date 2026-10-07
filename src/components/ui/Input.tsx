import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
    return (
        <input
            ref={ref}
            className={cn(
                'border-base-300 focus:ring-primary/20 focus:border-primary w-full rounded-lg border px-3 py-2 text-base focus:ring-2 focus:outline-none sm:text-sm',
                className,
            )}
            {...props}
        />
    );
});
Input.displayName = 'Input';
