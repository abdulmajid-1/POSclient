import { useQuery } from '@tanstack/react-query';
import { getCategories } from '../services/categoryService';

/**
 * Fetches all categories.
 * staleTime: 5 minutes — categories rarely change.
 */
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories().then((r) => r.data.data),
    staleTime: 300_000,
  });
}
