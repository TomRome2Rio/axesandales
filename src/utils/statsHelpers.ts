import type { Booking } from '../types';

export const normalizeStatText = (value: string) => value.trim().toLowerCase();

export const isVisibleGameSystem = (value: string) => {
  const normalized = normalizeStatText(value);
  return Boolean(normalized) && normalized !== 'unavailable' && normalized !== 'not available';
};

export const isStatsVisibleBooking = (booking: Pick<Booking, 'status' | 'gameSystem' | 'markedUnavailable'>) => (
  booking.status !== 'cancelled'
  && !booking.markedUnavailable
  && isVisibleGameSystem(booking.gameSystem)
);
