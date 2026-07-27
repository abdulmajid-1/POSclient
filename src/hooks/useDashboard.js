import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '../services/dashboardService';
import { getWeeklySummary, getMonthlySummary } from '../services/saleService';

/**
 * Calculates start/end dates for a given range type.
 * - daily:   starts at midnight (00:00) today
 * - weekly:  starts from the most recent Saturday at 00:00
 * - monthly: starts from the 1st of the current month at 00:00
 * - yearly:  starts from Jan 1st of the current year at 00:00
 */
function calculateDates(type) {
  const now = new Date();
  let start = new Date();
  let end = new Date();

  if (type === 'daily') {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (type === 'weekly') {
    // Week starts on Saturday (day 6). Find the most recent Saturday.
    const day = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const daysSinceSaturday = (day + 1) % 7; // Sat=0, Sun=1, Mon=2, ...
    start.setDate(now.getDate() - daysSinceSaturday);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (type === 'monthly') {
    // Start from the 1st of the current month
    start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (type === 'yearly') {
    start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
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
