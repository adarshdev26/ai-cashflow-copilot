import { apiFetch } from '@/lib/api-client';

export function changePassword(input: { currentPassword: string; newPassword: string }) {
    return apiFetch<{ message: string }>('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
    });
}
