import { ThemeMenu } from '@/components/ui/ThemePicker';

export function AuthShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="bg-base-200 text-base-content relative flex min-h-screen items-center justify-center px-4 py-10">
            <div className="absolute top-4 right-4">
                <ThemeMenu />
            </div>
            {children}
        </div>
    );
}
