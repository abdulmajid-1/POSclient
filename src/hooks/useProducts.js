import { useQuery } from '@tanstack/react-query';
import { getProducts } from '../services/productService';

/**
 * Fetches paginated products with optional filters.
 * Cache key includes all filter params so each unique combination is cached separately.
 * staleTime: 30s — products change frequently on POS
 */
export function useProducts(params = {}) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => getProducts(params).then((r) => r.data),
    staleTime: 30_000,
    placeholderData: (prev) => prev, // keep previous data visible while new page loads
  });
}
