/**
 * Business Date Utilities
 * 
 * CRITICAL RULE: Business day boundary is 4:00 AM, NOT midnight.
 * - Any sale made between 4:00 AM today and 3:59:59 AM tomorrow belongs to "today's" business day.
 * - A new business day starts at 4:00 AM every day.
 */

/**
 * Returns the business day string ("YYYY-MM-DD") for a given date or current time.
 * @param {Date|string|number} [inputDate=new Date()]
 * @returns {string} Date in YYYY-MM-DD format
 */
export function getBusinessDate(inputDate = new Date()) {
  const d = new Date(inputDate);
  // Subtract 4 hours from the local time
  // E.g. Sep 30 at 03:30 AM -> shifted to Sep 29 at 23:30 PM -> Business day: Sep 29
  // Sep 30 at 04:00 AM -> shifted to Sep 30 at 00:00 AM -> Business day: Sep 30
  const shifted = new Date(d.getTime() - 4 * 60 * 60 * 1000);

  const year = shifted.getFullYear();
  const month = String(shifted.getMonth() + 1).padStart(2, '0');
  const day = String(shifted.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Returns the exact Date object for the next 4:00 AM rollover.
 * @param {Date} [now=new Date()]
 * @returns {Date}
 */
export function getNextRolloverTime(now = new Date()) {
  const rollover = new Date(now);
  if (now.getHours() >= 4) {
    // Current time is 4:00 AM or later today; next rollover is tomorrow at 4:00 AM
    rollover.setDate(rollover.getDate() + 1);
  }
  rollover.setHours(4, 0, 0, 0);
  return rollover;
}

/**
 * Returns remaining milliseconds, seconds, minutes, and formatted string until next 4:00 AM rollover.
 * @param {Date} [now=new Date()]
 */
export function getRolloverCountdown(now = new Date()) {
  const nextRollover = getNextRolloverTime(now);
  const diffMs = Math.max(0, nextRollover.getTime() - now.getTime());

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    nextRolloverTime: nextRollover.toISOString(),
    remainingMs: diffMs,
    hours,
    minutes,
    seconds,
    formatted: `${hours}h ${minutes}m ${seconds}s`,
  };
}

/**
 * Returns start and end timestamps for a given business day date string "YYYY-MM-DD"
 * @param {string} businessDateStr
 */
export function getBusinessDayInterval(businessDateStr) {
  const [year, month, day] = businessDateStr.split('-').map(Number);
  const start = new Date(year, month - 1, day, 4, 0, 0, 0);
  const end = new Date(year, month - 1, day + 1, 3, 59, 59, 999);
  return { start, end };
}
