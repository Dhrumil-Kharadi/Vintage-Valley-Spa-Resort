import { BOOKING_CONFIG } from '../config/bookingConfig';

export interface BookingEngineOptions {
  checkIn?: string | Date;
  checkOut?: string | Date;
  adults?: number;
  children?: number;
}

/**
 * Formats a Date object or date string into DD-MM-YYYY required by EZEE Booking Engine.
 */
export function formatDateForEzee(dateInput?: string | Date | null): string {
  if (!dateInput) return '';

  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    // Match YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [yyyy, mm, dd] = trimmed.split('-');
      return `${dd}-${mm}-${yyyy}`;
    }
    // Already DD-MM-YYYY
    if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
      return trimmed;
    }
    // Attempt standard parse
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      const dd = String(parsed.getDate()).padStart(2, '0');
      const mm = String(parsed.getMonth() + 1).padStart(2, '0');
      const yyyy = parsed.getFullYear();
      return `${dd}-${mm}-${yyyy}`;
    }
  }

  if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
    const dd = String(dateInput.getDate()).padStart(2, '0');
    const mm = String(dateInput.getMonth() + 1).padStart(2, '0');
    const yyyy = dateInput.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }

  return '';
}

/**
 * Launches the official EZEE Booking Engine in a new browser tab with checkin, checkout, adult, and child parameters.
 */
export function openEzeeBookingEngine(options: BookingEngineOptions = {}): void {
  if (typeof window === 'undefined') return;

  const checkinStr = formatDateForEzee(options.checkIn);
  const checkoutStr = formatDateForEzee(options.checkOut);
  const adultVal = options.adults ?? BOOKING_CONFIG.defaultParams.adults;
  const childVal = options.children ?? BOOKING_CONFIG.defaultParams.children;

  // Build temporary form to send POST request matching official widget behavior
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = BOOKING_CONFIG.bookingUrl;
  form.target = '_blank';
  form.name = '_resBBBoxSubmit';
  form.style.display = 'none';

  const fields: Record<string, string> = {};
  if (checkinStr) fields.checkin = checkinStr;
  if (checkoutStr) fields.checkout = checkoutStr;
  if (adultVal !== undefined && adultVal !== null) fields.adult = String(adultVal);
  if (childVal !== undefined && childVal !== null) fields.child = String(childVal);

  Object.entries(fields).forEach(([key, val]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = val;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
}
