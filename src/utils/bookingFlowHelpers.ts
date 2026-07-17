import type { Booking } from '../types';

export type BookingFormState = {
  gameSystem: string;
  playerCount: number;
  playerCountManuallySet: boolean;
  taggedPlayerIds: string[];
};

export const shouldAutoAddGameSystem = (
  booking: Pick<Booking, 'gameSystem' | 'markedUnavailable'>,
  gameSystems: string[]
): boolean => {
  if (booking.markedUnavailable) return false;

  const normalizedBookingName = booking.gameSystem.trim().toLowerCase();
  if (!normalizedBookingName) return false;

  return !gameSystems.some(gameSystem => gameSystem.trim().toLowerCase() === normalizedBookingName);
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
