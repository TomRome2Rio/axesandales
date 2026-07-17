import type { SwapMeetBooking, User } from '../types';
import {
  buildSwapMeetBooking,
  getSwapMeetBookedStallCount,
  isSwapMeetBookingActive,
  validateSwapMeetStallCount,
} from './swapMeetService';

let localSwapMeetBookings: SwapMeetBooking[] = [];
const localSwapMeetSubscribers = new Set<(bookings: SwapMeetBooking[]) => void>();

const sortBookings = (bookings: SwapMeetBooking[]): SwapMeetBooking[] => {
  return [...bookings].sort((left, right) => left.userName.localeCompare(right.userName, undefined, { sensitivity: 'base' }));
};

const notifySubscribers = (): void => {
  const bookings = sortBookings(localSwapMeetBookings);
  localSwapMeetSubscribers.forEach(callback => callback(bookings));
};

export const subscribeLocalSwapMeetBookings = (
  callback: (bookings: SwapMeetBooking[]) => void
): (() => void) => {
  localSwapMeetSubscribers.add(callback);
  callback(sortBookings(localSwapMeetBookings));
  return () => {
    localSwapMeetSubscribers.delete(callback);
  };
};

export const saveLocalSwapMeetBooking = async (
  user: User,
  stallCount: number
): Promise<void> => {
  const existingBooking = localSwapMeetBookings.find(booking => booking.userId === user.id) ?? null;
  const previousStallCount = existingBooking && isSwapMeetBookingActive(existingBooking)
    ? existingBooking.stallCount
    : 0;
  const bookedStallCount = getSwapMeetBookedStallCount(localSwapMeetBookings);
  const validation = validateSwapMeetStallCount(
    stallCount,
    previousStallCount,
    bookedStallCount
  );

  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const booking = buildSwapMeetBooking(user, stallCount, existingBooking);
  localSwapMeetBookings = [
    ...localSwapMeetBookings.filter(item => item.userId !== user.id),
    booking,
  ];
  notifySubscribers();
};

export const markLocalSwapMeetBookingPaid = async (
  bookingId: string,
  adminUser: User
): Promise<void> => {
  const now = Date.now();
  localSwapMeetBookings = localSwapMeetBookings.map(booking => (
    booking.id === bookingId
      ? {
        ...booking,
        paid: true,
        status: 'confirmed',
        updatedAt: now,
        paidAt: now,
        paidBy: adminUser.id,
      }
      : booking
  ));
  notifySubscribers();
};

export const cancelLocalSwapMeetBooking = async (
  bookingId: string,
  cancelledByUser: User
): Promise<void> => {
  const now = Date.now();
  localSwapMeetBookings = localSwapMeetBookings.map(booking => (
    booking.id === bookingId
      ? {
        ...booking,
        status: 'cancelled',
        updatedAt: now,
        cancelledAt: now,
        cancelledBy: cancelledByUser.id,
      }
      : booking
  ));
  notifySubscribers();
};

export const markLocalSwapMeetBookingInvoiced = async (
  bookingId: string,
  adminUser: User
): Promise<void> => {
  const now = Date.now();
  localSwapMeetBookings = localSwapMeetBookings.map(booking => (
    booking.id === bookingId
      ? {
        ...booking,
        invoiced: true,
        updatedAt: now,
        invoicedAt: now,
        invoicedBy: adminUser.id,
      }
      : booking
  ));
  notifySubscribers();
};
