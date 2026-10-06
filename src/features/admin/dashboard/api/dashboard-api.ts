import { apiFetch } from '../../shared/api/admin-api';
import type { AdminDashboardData } from '../types';

export const adminDashboardApi = {
    get: () => apiFetch<AdminDashboardData>('/api/admin/dashboard'),
};
