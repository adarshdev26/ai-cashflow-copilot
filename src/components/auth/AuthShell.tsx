import { ThemeMenu } from '@/components/ui/ThemePicker';

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-base-200 px-4 py-10 text-base-content">
      <div className="absolute right-4 top-4">
        <ThemeMenu />
      </div>
      {children}
    </div>
  );
}