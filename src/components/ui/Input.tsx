import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full px-3 py-2 border border-base-300 rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
