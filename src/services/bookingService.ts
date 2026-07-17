import { Booking, TerrainBox, User } from '../types';
import { INITIAL_TERRAIN_BOXES } from '../constants';
import { generateUUID } from '../utils';

export interface BookingInput {
  date: string;
  tableId: string;
  terrainBoxId?: string;
  secondaryTerrainId?: string;
  gameSystem: string;
  playerCount: number;
  taggedPlayerIds: string[];
  markedUnavailable?: boolean;
}

export interface BookingValidationContext {
  cancelledDates: string[];
  user: User;
  existingBookings: Booking[];
  terrainBoxes?: TerrainBox[];
  editingBookingId?: string;
}

export interface BookingValidationResult {
  valid: boolean;
  error?: string;
}

export interface SecondaryTerrainStatus {
  capacity: number;
  availableCount: number;
  isCapacityLimited: boolean;
  isFull: boolean;
  isBookedByUser: boolean;
  booking?: Booking;
}

export function getSecondaryTerrainStatus(
  box: TerrainBox,
  bookings: Booking[],
  currentUserId?: string
): SecondaryTerrainStatus {
  const capacity = box.maxBookingsPerNight ?? 1;
  const activeBookings = bookings.filter(
    booking => booking.status === 'active' && booking.secondaryTerrainId === box.id
  );
  const availableCount = Math.max(0, capacity - activeBookings.length);
  const booking = currentUserId
    ? activeBookings.find(booking => booking.memberId === currentUserId || booking.taggedPlayerIds.includes(currentUserId))
    : undefined;

  return {
    capacity,
    availableCount,
    isCapacityLimited: capacity > 1,
    isFull: capacity > 1 && availableCount <= 0,
    isBookedByUser: Boolean(booking),
    booking,
  };
}

/**
 * Validate booking input before persisting.
 */
export function validateBooking(
  input: BookingInput,
  context: BookingValidationContext
): BookingValidationResult {
  if (context.cancelledDates.includes(input.date)) {
    return { valid: false, error: 'This date has been cancelled. Bookings are not allowed.' };
  }

  if (!context.user.isMember) {
    return { valid: false, error: 'Your membership is not active. Please contact an admin.' };
  }

  const isMarkedUnavailable = Boolean(input.markedUnavailable);
  if (!input.tableId) {
    return { valid: false, error: 'Please select a table and enter a game system.' };
  }

  if (!isMarkedUnavailable && !input.gameSystem) {
    return { valid: false, error: 'Please select a table and enter a game system.' };
  }

  // Check table availability for the given date
  if (input.tableId) {
    const conflicting = context.existingBookings.find(
      b => b.date === input.date &&
           b.tableId === input.tableId &&
           b.status === 'active' &&
           b.id !== context.editingBookingId
    );
    if (conflicting) {
      return { valid: false, error: `Table is already booked by ${conflicting.memberName}.` };
    }
  }

  // Check terrain availability (if selected)
  if (input.terrainBoxId) {
    const terrainConflict = context.existingBookings.find(
      b => b.date === input.date &&
           b.terrainBoxId === input.terrainBoxId &&
           b.status === 'active' &&
           b.id !== context.editingBookingId
    );
    if (terrainConflict) {
      return { valid: false, error: `Terrain is already reserved by ${terrainConflict.memberName}.` };
    }
  }

  if (input.secondaryTerrainId) {
    const secondaryTerrainBox = (context.terrainBoxes ?? INITIAL_TERRAIN_BOXES).find(box => box.id === input.secondaryTerrainId);
    const secondaryTerrainCapacity = secondaryTerrainBox?.maxBookingsPerNight ?? 1;
    if (secondaryTerrainCapacity > 1) {
      const secondaryTerrainBookings = context.existingBookings.filter(
        b => b.date === input.date &&
          b.secondaryTerrainId === input.secondaryTerrainId &&
          b.status === 'active' &&
          b.id !== context.editingBookingId
      );
      if (secondaryTerrainBookings.length >= secondaryTerrainCapacity) {
        return { valid: false, error: 'That terrain set is fully booked for this date.' };
      }
    }
  }

  return { valid: true };
}

/**
 * Build a Booking object from validated input.
 * All fields are set to Firestore-safe values (no undefined).
 */
export function createBookingFromInput(
  input: BookingInput,
  user: User,
  editingBooking?: Booking | null
): Booking {
  return {
    id: editingBooking ? editingBooking.id : generateUUID(),
    date: input.date,
    tableId: input.tableId,
    terrainBoxId: input.terrainBoxId || null,
    secondaryTerrainId: input.secondaryTerrainId || null,
    memberName: user.name,
    memberId: user.id,
    gameSystem: input.markedUnavailable ? 'Unavailable' : input.gameSystem,
    playerCount: input.markedUnavailable ? 0 : input.playerCount,
    taggedPlayerIds: input.markedUnavailable ? [] : input.taggedPlayerIds,
    markedUnavailable: Boolean(input.markedUnavailable),
    timestamp: Date.now(),
    status: editingBooking ? editingBooking.status : 'active',
  };
}

/**
 * Ensure a booking object contains no undefined values (Firestore rejects them).
 */
export function sanitizeBookingForFirestore(booking: Booking): Booking {
  return {
    id: booking.id,
    date: booking.date,
    tableId: booking.tableId,
    terrainBoxId: booking.terrainBoxId ?? null,
    secondaryTerrainId: booking.secondaryTerrainId ?? null,
    memberName: booking.memberName,
    memberId: booking.memberId,
    gameSystem: booking.gameSystem,
    playerCount: booking.playerCount,
    taggedPlayerIds: booking.taggedPlayerIds ?? [],
    markedUnavailable: booking.markedUnavailable ?? false,
    timestamp: booking.timestamp,
    status: booking.status,
    ...(booking.cancelledAt !== undefined ? { cancelledAt: booking.cancelledAt } : {}),
    ...(booking.cancelledBy !== undefined ? { cancelledBy: booking.cancelledBy } : {}),
  };
}

/**
 * Check whether a user is allowed to cancel/edit a booking.
 */
export function canModifyBooking(booking: Booking, user: User | null): boolean {
  if (!user) return false;
  if (user.isAdmin) return true;
  return booking.memberId === user.id;
}

/**
 * Build the cancellation update payload (mirrors firebaseService.cancelBooking).
 */
export function buildCancellationUpdate(cancelledByUserId: string): {
  status: 'cancelled';
  cancelledAt: number;
  cancelledBy: string;
} {
  return {
    status: 'cancelled',
    cancelledAt: Date.now(),
    cancelledBy: cancelledByUserId,
  };
}
