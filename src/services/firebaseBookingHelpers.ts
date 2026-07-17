import { INITIAL_TERRAIN_BOXES } from '../constants';
import type { Booking } from '../types';

export const mapBookingSnapshotData = (id: string, data: Record<string, unknown>): Booking => {
  const bookingData = data as Partial<Booking>;
  return {
    ...(bookingData as Booking),
    id,
    terrainBoxId: bookingData.terrainBoxId ?? null,
    secondaryTerrainId: bookingData.secondaryTerrainId ?? null,
    taggedPlayerIds: bookingData.taggedPlayerIds ?? [],
    markedUnavailable: bookingData.markedUnavailable ?? false,
  };
};

export const getBookingSaveConflicts = (
  booking: Booking,
  activeBookings: Booking[]
): string[] => {
  const conflicts: string[] = [];
  const tableConflict = activeBookings.find(
    existing =>
      existing.id !== booking.id &&
      existing.date === booking.date &&
      existing.status === 'active' &&
      existing.tableId === booking.tableId
  );
  if (tableConflict) {
    const name = tableConflict.memberName || 'another member';
    conflicts.push(`That table has just been booked by ${name}.`);
  }

  if (booking.terrainBoxId) {
    const terrainConflict = activeBookings.find(
      existing =>
        existing.id !== booking.id &&
        existing.date === booking.date &&
        existing.status === 'active' &&
        existing.terrainBoxId === booking.terrainBoxId
    );
    if (terrainConflict) {
      const name = terrainConflict.memberName || 'another member';
      conflicts.push(`That terrain set has just been reserved by ${name}.`);
    }
  }

  if (booking.secondaryTerrainId) {
    const secondaryTerrainBox = INITIAL_TERRAIN_BOXES.find(box => box.id === booking.secondaryTerrainId);
    const secondaryTerrainCapacity = secondaryTerrainBox?.maxBookingsPerNight ?? 1;
    if (secondaryTerrainCapacity > 1) {
      const secondaryTerrainBookings = activeBookings.filter(
        existing =>
          existing.id !== booking.id &&
          existing.date === booking.date &&
          existing.status === 'active' &&
          existing.secondaryTerrainId === booking.secondaryTerrainId
      );
      if (secondaryTerrainBookings.length >= secondaryTerrainCapacity) {
        conflicts.push('That terrain set is fully booked for this date.');
      }
    }
  }

  return conflicts;
};
