import { toast, type ToastOptions } from 'react-toastify';

// Words that force a red (error) toast even on success.
// Add/remove words here as needed.
const RED_KEYWORDS = ['deleted', 'delete', 'removed'];

function shouldBeRed(message: string): boolean {
    const lower = message.toLowerCase();
    return RED_KEYWORDS.some((word) => lower.includes(word));
}

export const notify = {
    success: (message: string, options?: ToastOptions) =>
        shouldBeRed(message)
            ? toast.error(message, options) // red
            : toast.success(message, options), // green
    error: (message: string, options?: ToastOptions) => toast.error(message, options),
    info: (message: string, options?: ToastOptions) => toast.info(message, options),
};

export function getErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
    if (error instanceof Error && error.message) return error.message;
    if (typeof error === 'string' && error) return error;
    return fallback;
}
