/**
 * React Query configuration with request cancellation support
 */
import { QueryClient } from 'react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Enable request cancellation
      refetchOnWindowFocus: false,
      retry: 1,
      // Stale time - data is considered fresh for 30 seconds
      staleTime: 30 * 1000,
      // Cache time - unused data stays in cache for 5 minutes
      cacheTime: 5 * 60 * 1000,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    },
  },
})

export default queryClient

