import { useCallback } from 'react';
import { openEzeeBookingEngine, BookingEngineOptions } from '../services/ezeeBookingService';

/**
 * Custom React hook to trigger the official EZEE Booking Engine.
 */
export function useBookingEngine() {
  const handleOpenBookingEngine = useCallback((options?: BookingEngineOptions) => {
    openEzeeBookingEngine(options);
  }, []);

  return {
    openBookingEngine: handleOpenBookingEngine,
  };
}

export default useBookingEngine;
