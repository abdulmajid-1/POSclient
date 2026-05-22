import { useQuery } from '@tanstack/react-query';
import { getSuppliers } from '../services/supplierService';

/**
 * Fetches all suppliers.
 * staleTime: 2 minutes — supplier list changes infrequently.
 */
export function useSuppliers() {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: () => getSuppliers().then((r) => r.data.data),
    staleTime: 120_000,
  });
}
