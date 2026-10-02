import { apiFetch } from '@/lib/api-client';

export function updateProfile(input: { name: string }) {
  return apiFetch<{ id: string; name: string | null; email: string }>('/api/auth/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}