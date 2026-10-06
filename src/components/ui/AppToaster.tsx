'use client';

import type { CSSProperties } from 'react';
import { ToastContainer } from 'react-toastify';
import { usePublicSettings } from '@/features/settings/hooks/use-settings';

const toastStyle = {
    '--toastify-color-light': 'var(--color-base-100)',
    '--toastify-text-color-light': 'var(--color-base-content)',
    '--toastify-color-success': 'var(--color-success)',
    '--toastify-color-error': 'var(--color-error)',
    '--toastify-color-info': 'var(--color-info)',
    '--toastify-color-warning': 'var(--color-warning)',
} as CSSProperties;

export function AppToaster() {
    const { data } = usePublicSettings();
    return (
        <ToastContainer
            position="bottom-right"
            autoClose={Number(data?.['ui.toastDurationMs'] ?? 4000)}
            limit={Number(data?.['ui.toastLimit'] ?? 4)}
            newestOnTop
            closeOnClick
            pauseOnHover
            pauseOnFocusLoss={false}
            theme="colored"
            style={toastStyle}
        />
    );
}
