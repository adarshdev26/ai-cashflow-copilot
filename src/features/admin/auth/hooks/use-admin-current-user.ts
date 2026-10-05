import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../shared/api/admin-api';
import type { AdminProfile } from '../../shared/types';

export function useAdminCurrentUser() {
  return useQuery({ queryKey: ['admin-current-user'], queryFn: () => apiFetch<AdminProfile>('/api/admin/auth/me') });
}
