/**
 * Date formatting utilities for bills, receipts, invoices, and reports.
 * Formats dates strictly as Date-Month-Year (DD/MM/YYYY)
 */

export const formatBillDate = (dateVal, includeTime = true) => {
  if (!dateVal) return '';

  // If it's a date-only string like "YYYY-MM-DD", avoid UTC-midnight timezone shifts
  if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal.trim())) {
    const [year, month, day] = dateVal.trim().split('-');
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }

  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const datePart = `${day}/${month}/${year}`;

  if (includeTime) {
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const hourStr = String(hours).padStart(2, '0');
    return `${datePart}, ${hourStr}:${minutes} ${ampm}`;
  }

  return datePart;
};

export const formatBillDateOnly = (dateVal) => formatBillDate(dateVal, false);

/**
 * Returns today's date formatted as YYYY-MM-DD in local time
 */
export const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Converts any date or ISO string into YYYY-MM-DD for <input type="date" />
 */
export const toInputDateValue = (dateVal) => {
  if (!dateVal) return getTodayDateString();
  if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal.trim())) {
    return dateVal.trim();
  }
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return getTodayDateString();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Combines a YYYY-MM-DD date string with the current local time of day
 * so the historical record has an accurate timestamp on that date.
 */
export const combineDateWithCurrentTime = (dateStr) => {
  if (!dateStr) return new Date().toISOString();
  const todayStr = getTodayDateString();
  const now = new Date();

  if (dateStr === todayStr) {
    return now.toISOString();
  }

  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3) return now.toISOString();
  const [year, month, day] = parts;

  // Preserve the current time of day on the chosen date
  const combined = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds());
  return isNaN(combined.getTime()) ? now.toISOString() : combined.toISOString();
};

/**
 * Calculates start and end ISO strings based on a range type
 * Types: 'today' | 'month' | 'yearly' | 'custom' | 'all'
 */
export const calculateDates = (type, startDate, endDate) => {
  const now = new Date();
  let start = new Date();
  let end = new Date();

  if (type === 'today' || type === 'daily') {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (type === 'month' || type === 'monthly') {
    start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  } else if (type === 'yearly' || type === 'year') {
    start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  } else if (type === 'custom') {
    if (!startDate || !endDate) return null;
    const s = new Date(startDate + 'T00:00:00');
    const e = new Date(endDate + 'T23:59:59.999');
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return null;
    return { start: s.toISOString(), end: e.toISOString() };
  } else if (type === 'all') {
    return null;
  }

  return { start: start.toISOString(), end: end.toISOString() };
};

