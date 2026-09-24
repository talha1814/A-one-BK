import { format, differenceInDays, differenceInHours, addDays, parseISO } from 'date-fns';

export function formatDateStandard(dateOrString) {
  if (!dateOrString) return '-';
  const d = typeof dateOrString === 'string' ? parseISO(dateOrString) : dateOrString;
  return format(d, 'dd-MM-yyyy');
}

export function formatDateTimeStandard(dateOrString) {
  if (!dateOrString) return '-';
  const d = typeof dateOrString === 'string' ? parseISO(dateOrString) : dateOrString;
  return format(d, 'dd-MM-yyyy HH:mm');
}

export function formatTimeStandard(dateOrString) {
  if (!dateOrString) return '-';
  const d = typeof dateOrString === 'string' ? parseISO(dateOrString) : dateOrString;
  return format(d, 'HH:mm');
}

export function getDaysRemaining(expiresOn) {
  if (!expiresOn) return 0;
  const now = new Date();
  const expiry = typeof expiresOn === 'string' ? parseISO(expiresOn) : expiresOn;
  return differenceInDays(expiry, now);
}

export function isLicenceExpired(expiresOn) {
  if (!expiresOn) return true;
  const now = new Date();
  const expiry = typeof expiresOn === 'string' ? parseISO(expiresOn) : expiresOn;
  return now.getTime() > expiry.getTime();
}

export function calculateNewExpiry(currentExpiry, daysToAdd) {
  const base = currentExpiry && !isLicenceExpired(currentExpiry) 
    ? (typeof currentExpiry === 'string' ? parseISO(currentExpiry) : currentExpiry)
    : new Date();
  
  const updated = addDays(base, Number(daysToAdd));
  updated.setHours(23, 59, 59, 999);
  return updated.toISOString();
}
