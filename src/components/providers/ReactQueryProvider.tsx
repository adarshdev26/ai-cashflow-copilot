'use client';

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { ApiError } from '@/lib/api-client';

let redirecting = false;

// Any 401 from any query or mutation ends up here.
function handleAuthError(error: unknown) {
  if (!(error instanceof ApiError) || error.status !== 401) return;
  if (typeof window === 'undefined' || redirecting) return;

  // A wrong password on the login form is also a 401. Don't redirect from auth pages.
  const path = window.location.pathname;
  if (path.startsWith('/login') || path.startsWith('/signup')) return;

  redirecting = true; // several parallel queries fail together; redirect once
  // Full page navigation: clears the bad cookie via the route handler AND wipes the in-memory cache
  window.location.replace('/api/auth/invalid');
}

export function ReactQueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({ onError: handleAuthError }),
        mutationCache: new MutationCache({ onError: handleAuthError }),
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            refetchOnWindowFocus: false,
            // Retrying can't fix "not logged in" or "not allowed", so fail immediately
            retry: (failureCount, error) => {
              if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
                return false;
              }
              return failureCount < 3; // React Query's default
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}