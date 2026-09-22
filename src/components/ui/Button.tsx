import { forwardRef } from 'react';
import { cn } from '@/lib/cn';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, leftIcon, children, disabled, type = 'button', ...props }, ref) => {
    
    const baseClasses = "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 disabled:opacity-50 disabled:pointer-events-none";
    
    const variantClasses = {
      primary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm",
      secondary: "text-slate-700 hover:bg-slate-100",
      danger: "bg-red-600 hover:bg-red-700 text-white shadow-sm",
      ghost: "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
    };

    const sizeClasses = {
      sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
      md: "h-10 px-4 py-2 text-sm rounded-lg gap-2",
      lg: "h-12 px-6 text-base rounded-xl gap-2",
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading}
        className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {!loading && leftIcon}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export const PrimaryButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="primary" {...props} />
);
PrimaryButton.displayName = 'PrimaryButton';
