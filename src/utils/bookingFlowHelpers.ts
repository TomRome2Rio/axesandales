import type { Booking } from '../types';

export type BookingFormState = {
  gameSystem: string;
  playerCount: number;
  playerCountManuallySet: boolean;
  taggedPlayerIds: string[];
};

const normalizeGameSystemKey = (value: string) => value.replace(/\s+/g, '').toLowerCase();

type BookedGameSystem = Pick<Booking, 'gameSystem' | 'status'>;

export const shouldAutoAddGameSystem = (
  booking: Pick<Booking, 'gameSystem' | 'markedUnavailable'>,
  gameSystems: string[]
): boolean => {
  if (booking.markedUnavailable) return false;

  const normalizedBookingName = normalizeGameSystemKey(booking.gameSystem);
  if (!normalizedBookingName) return false;

  return !gameSystems.some(gameSystem => normalizeGameSystemKey(gameSystem) === normalizedBookingName);
};

export const sanitizeBookingGameSystem = (
  booking: Pick<Booking, 'gameSystem' | 'markedUnavailable'>,
  existingGameSystems: string[],
  existingBookings: BookedGameSystem[]
): string => {
  if (booking.markedUnavailable) {
    return booking.gameSystem;
  }

  const normalizedEnteredName = normalizeGameSystemKey(booking.gameSystem);
  if (!normalizedEnteredName) {
    return booking.gameSystem;
  }

  const matchingSystems = existingGameSystems.filter(
    gameSystem => normalizeGameSystemKey(gameSystem) === normalizedEnteredName
  );

  if (matchingSystems.length === 0) {
    return booking.gameSystem;
  }

  const bookingCounts = new Map<string, number>();
  existingBookings.forEach(existingBooking => {
    if (existingBooking.status === 'cancelled') return;
    const count = bookingCounts.get(existingBooking.gameSystem) ?? 0;
    bookingCounts.set(existingBooking.gameSystem, count + 1);
  });

  return matchingSystems
    .map(name => ({
      name,
      count: bookingCounts.get(name) ?? 0,
    }))
    .sort((a, b) =>
      b.count - a.count ||
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) ||
      a.name.localeCompare(b.name)
    )[0].name;
};

export const applyMarkedUnavailableToggle = (
  currentState: BookingFormState,
  markedUnavailable: boolean
): BookingFormState => {
  if (markedUnavailable) {
    return {
      ...currentState,
      gameSystem: 'Unavailable',
      playerCount: 0,
      playerCountManuallySet: true,
      taggedPlayerIds: [],
    };
  }

  return {
    ...currentState,
    gameSystem: currentState.gameSystem === 'Unavailable' ? '' : currentState.gameSystem,
    playerCount: currentState.playerCount === 0 ? 2 : currentState.playerCount,
    playerCountManuallySet: false,
  };
};
