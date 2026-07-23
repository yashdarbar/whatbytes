import { QueryClient } from '@tanstack/react-query';

/**
 * Shared server-state client. Queries receive one automatic retry for transient
 * failures, while writes surface errors immediately so forms can respond.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
    mutations: {
      retry: false,
    },
  },
});
