import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from '../api/get-current-user';

export function useCurrentUser() {
  return useQuery({
    queryKey: ['current-user'],
    queryFn: getCurrentUser,
    staleTime: 1000 * 60 * 10, // user details rarely change
  });
}