'use client';

import type { CSSProperties } from 'react';
import { ToastContainer } from 'react-toastify';

// Change the hex values here and every toast in the app follows.
const TOAST_COLORS = {
  success: '#16a34a',
  error: '#dc2626',
  info: '#4f46e5',
  warning: '#d97706',
};

const toastStyle = {
  '--toastify-color-success': TOAST_COLORS.success,
  '--toastify-color-error': TOAST_COLORS.error,
  '--toastify-color-info': TOAST_COLORS.info,
  '--toastify-color-warning': TOAST_COLORS.warning,
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