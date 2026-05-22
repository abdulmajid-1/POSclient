import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '../services/dashboardService';
import { getWeeklySummary, getMonthlySummary } from '../services/saleService';

/**
 * Calculates start/end dates for a given range type.
 */
function calculateDates(type) {
  const now = new Date();
  let start = new Date();
  let end = new Date();

  if (type === 'daily') {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (type === 'weekly') {
    start.setDate(now.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (type === 'monthly') {
    start.setDate(now.getDate() - 30);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (type === 'yearly') {
    start.setDate(now.getDate() - 365);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  }

  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

/**
 * Dashboard stats — re-fetches when rangeType changes.
 * staleTime: 60s
 */
export function useDashboardStats(rangeType) {
  const dates = calculateDates(rangeType);
  return useQuery({
    queryKey: ['dashboard', rangeType],
    queryFn: () => getDashboardStats(dates).then((r) => r.data),
    staleTime: 60_000,
  });
}

/**
 * Weekly sales summary — changes rarely, 5 min stale time.
 */
export function useWeeklySummary() {
  return useQuery({
    queryKey: ['weekly-summary'],
    queryFn: () => getWeeklySummary().then((r) => r.data),
    staleTime: 300_000,
  });
}

/**
 * Monthly sales summary — changes rarely, 5 min stale time.
 */
export function useMonthlySummary() {
  return useQuery({
    queryKey: ['monthly-summary'],
    queryFn: () => getMonthlySummary().then((r) => r.data),
    staleTime: 300_000,
  });
}

export { calculateDates };
