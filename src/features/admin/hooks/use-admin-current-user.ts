import { useQuery } from '@tanstack/react-query';
import { adminFetch } from '@/features/admin/lib/admin-fetch';
import type { AdminProfile } from '../lib/types';

export function useAdminCurrentUser() {
  return useQuery({
    queryKey: ['admin-current-user'],
    queryFn: () => adminFetch<AdminProfile>('/api/admin/auth/me'),
  });
}