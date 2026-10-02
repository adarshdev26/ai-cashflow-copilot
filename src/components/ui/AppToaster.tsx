'use client';

import type { CSSProperties } from 'react';
import { ToastContainer } from 'react-toastify';

const toastStyle = {
  '--toastify-color-light': 'var(--color-base-100)',
  '--toastify-text-color-light': 'var(--color-base-content)',
  '--toastify-color-success': 'var(--color-success)',
  '--toastify-color-error': 'var(--color-error)',
  '--toastify-color-info': 'var(--color-info)',
  '--toastify-color-warning': 'var(--color-warning)',
} as CSSProperties;

export function AppToaster() {
  return (
    <ToastContainer
      position="bottom-right"
      autoClose={4000}
      limit={4}
      newestOnTop
      closeOnClick
      pauseOnHover
      pauseOnFocusLoss={false}
      theme="colored"
      style={toastStyle}
    />
  );
}
