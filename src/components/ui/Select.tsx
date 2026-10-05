import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "w-full px-3 py-2 border border-base-300 rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-base-100",
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = 'Select';
