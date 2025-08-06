import { useQuery, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import { useEffect } from "react";
import { handleAuthError } from "@/lib/handle-auth-error";
import { queryClient } from "@/lib/queryClient";

export function useAuthAwareQuery<TData = unknown, TError = unknown>(
  options: UseQueryOptions<TData, TError>
): UseQueryResult<TData, TError> {
  const query = useQuery(options);

  useEffect(() => {
    // If there's an error, check if it's auth-related
    if (query.error) {
      const handled = handleAuthError(query.error, { queryClient });
      if (handled && options.queryKey) {
        // Force reset the query state to stop loading
        queryClient.removeQueries({ queryKey: options.queryKey });
      }
    }
  }, [query.error, options.queryKey]);

  return query;
}

// Example usage in a component:
// const { data, isLoading, error } = useAuthAwareQuery({
//   queryKey: ['classes'],
//   queryFn: fetchClasses,
// });