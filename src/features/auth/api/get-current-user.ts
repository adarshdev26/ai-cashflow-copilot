import { apiFetch } from '@/lib/api-client';
import { CurrentUser } from '../types';

export function getCurrentUser() {
    return apiFetch<CurrentUser>('/api/auth/me');
}
