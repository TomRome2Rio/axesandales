import { SwapMeetBooking, User } from '../types';

export const SWAP_MEET_DATE = '2026-07-19';
export const SWAP_MEET_TOTAL_STALLS = 30;
export const SWAP_MEET_MAX_STALLS_PER_USER = 4;
export const SWAP_MEET_STALL_PRICE = 10;

export interface SwapMeetValidationResult {
  valid: boolean;
  error?: string;
}

export const getSwapMeetBookedStallCount = (
  bookings: SwapMeetBooking[]
): number => bookings.reduce((total, booking) => total + booking.stallCount, 0);

export const getSwapMeetAvailableStallCount = (
  bookings: SwapMeetBooking[]
): number => Math.max(0, SWAP_MEET_TOTAL_STALLS - getSwapMeetBookedStallCount(bookings));

export const calculateSwapMeetAmountOwed = (
  stallCount: number,
  isMember: boolean
): number => {
  const paidStalls = isMember ? Math.max(0, stallCount - 1) : stallCount;
  return paidStalls * SWAP_MEET_STALL_PRICE;
};

export const validateSwapMeetStallCount = (
  requestedStallCount: number,
  existingStallCount: number,
  bookedStallCount: number
): SwapMeetValidationResult => {
  if (!Number.isInteger(requestedStallCount)) {
    return { valid: false, error: 'Please choose a whole number of stalls.' };
  }

  if (requestedStallCount < 1) {
    return { valid: false, error: 'Please book at least one stall.' };
  }

  if (requestedStallCount > SWAP_MEET_MAX_STALLS_PER_USER) {
    return {
      valid: false,
      error: `Each user can book up to ${SWAP_MEET_MAX_STALLS_PER_USER} stalls.`,
    };
  }

  const availableAfterCurrentBooking =
    SWAP_MEET_TOTAL_STALLS - bookedStallCount + existingStallCount;
  if (requestedStallCount > availableAfterCurrentBooking) {
    return {
      valid: false,
      error: `Only ${Math.max(0, availableAfterCurrentBooking)} stalls are still available.`,
    };
  }

  return { valid: true };
};

export const buildSwapMeetBooking = (
  user: User,
  stallCount: number,
  existingBooking?: SwapMeetBooking | null
): SwapMeetBooking => {
  const now = Date.now();
  const isMember = user.isMember || user.isAdmin === true;

  return {
    id: existingBooking?.id ?? user.id,
    userId: user.id,
    userName: user.name,
    stallCount,
    isMemberAtBooking: isMember,
    amountOwed: calculateSwapMeetAmountOwed(stallCount, isMember),
    paid: existingBooking?.paid ?? false,
    invoiced: existingBooking?.invoiced ?? false,
    createdAt: existingBooking?.createdAt ?? now,
    updatedAt: now,
    ...(existingBooking?.paidAt !== undefined ? { paidAt: existingBooking.paidAt } : {}),
    ...(existingBooking?.paidBy !== undefined ? { paidBy: existingBooking.paidBy } : {}),
    ...(existingBooking?.invoicedAt !== undefined ? { invoicedAt: existingBooking.invoicedAt } : {}),
    ...(existingBooking?.invoicedBy !== undefined ? { invoicedBy: existingBooking.invoicedBy } : {}),
  };
};
