/**
 * =====================================================================
 * A-ONE BUN KABAB - BUSINESS DAY HELPER (4:00 AM ROLLOVER)
 * =====================================================================
 * 
 * Logic (Karachi Time Asia/Karachi UTC+5):
 * - Dukaan raat ko 12 baje ke baad bhi khuli hoti hai (Late night Bun Kabab sales).
 * - Raat 12:00 baje se subah 04:00 AM tak ki sale pichle din (Yesterday) ki sale me count hoti hai.
 * - Subah 04:00 AM par naya karobari din (New Business Day) shuru hota hai.
 * 
 * If time in Asia/Karachi is before 04:00 AM:
 *   -> Business date = YESTERDAY (YYYY-MM-DD)
 * If time in Asia/Karachi is 04:00 AM or later:
 *   -> Business date = TODAY (YYYY-MM-DD)
 */

/**
 * Returns the current date and time parts in Asia/Karachi timezone
 * @param {Date|string|number} date 
 */
export function getPKTDateParts(date = new Date()) {
  const d = new Date(date);
  
  // Format in Asia/Karachi timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(d);
  const partMap = {};
  for (const part of parts) {
    partMap[part.type] = part.value;
  }

  return {
    year: parseInt(partMap.year, 10),
    month: parseInt(partMap.month, 10),
    day: parseInt(partMap.day, 10),
    hour: parseInt(partMap.hour, 10),
    minute: parseInt(partMap.minute, 10),
    second: parseInt(partMap.second, 10),
    dateStr: `${partMap.year}-${partMap.month}-${partMap.day}`,
  };
}

/**
 * Calculates business date string (YYYY-MM-DD) for a given timestamp
 * @param {Date|string|number} date 
 * @returns {string} YYYY-MM-DD
 */
export function getBusinessDate(date = new Date()) {
  const pkt = getPKTDateParts(date);

  // If before 4:00 AM PKT, rollover to previous calendar day
  if (pkt.hour < 4) {
    // Construct Date object in UTC based on PKT calendar day and subtract 1 day
    const calendarDate = new Date(Date.UTC(pkt.year, pkt.month - 1, pkt.day));
    calendarDate.setUTCDate(calendarDate.getUTCDate() - 1);
    
    const y = calendarDate.getUTCFullYear();
    const m = String(calendarDate.getUTCMonth() + 1).padStart(2, '0');
    const d = String(calendarDate.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // 4:00 AM or later is current calendar day
  const m = String(pkt.month).padStart(2, '0');
  const d = String(pkt.day).padStart(2, '0');
  return `${pkt.year}-${m}-${d}`;
}

/**
 * Get yesterday's business date
 */
export function getYesterdayBusinessDate() {
  const todayBiz = getBusinessDate();
  const [y, m, d] = todayBiz.split('-').map(Number);
  const dateObj = new Date(Date.UTC(y, m - 1, d));
  dateObj.setUTCDate(dateObj.getUTCDate() - 1);
  const resY = dateObj.getUTCFullYear();
  const resM = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
  const resD = String(dateObj.getUTCDate()).padStart(2, '0');
  return `${resY}-${resM}-${resD}`;
}

/**
 * Format timestamp in human readable PKT format (e.g. "11:45 PM", "12 Oct, 02:30 AM")
 */
export function formatPKTTime(date = new Date()) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(date));
}

export function formatPKTDateTime(date = new Date()) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(date));
}
