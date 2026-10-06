import { Loader2 } from 'lucide-react';

type PageTransitionOverlayProps = {
  message: string;
  isVisible: boolean;
};

export function PageTransitionOverlay({ message, isVisible }: PageTransitionOverlayProps) {
  return (
    <div
      role={isVisible ? 'status' : undefined}
      aria-live="polite"
      aria-hidden={!isVisible}
      className={`fixed inset-0 z-[60] flex items-center justify-center bg-base-100/70 backdrop-blur-sm transition-opacity duration-200 ${
        isVisible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      {isVisible && (
        <div className="flex flex-col items-center gap-3 text-center text-base-content">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
          <p className="text-sm font-medium">{message}</p>
        </div>
      )}
    </div>
  );
}
