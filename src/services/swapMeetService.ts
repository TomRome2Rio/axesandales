import { SwapMeetBooking, User } from '../types';

export const SWAP_MEET_TOTAL_STALLS = 30;
export const SWAP_MEET_MAX_STALLS_PER_USER = 4;
export const SWAP_MEET_STALL_PRICE = 10;
const FREE_HALF_TABLE_PAYMENT_ID = 'system-free-club-member-half-table';

export interface SwapMeetValidationResult {
  valid: boolean;
  error?: string;
}

export const isSwapMeetBookingActive = (
  booking: SwapMeetBooking
): boolean => booking.status !== 'cancelled';

export const getActiveSwapMeetBookings = (
  bookings: SwapMeetBooking[]
): SwapMeetBooking[] => bookings.filter(isSwapMeetBookingActive);

export const getSwapMeetBookedStallCount = (
  bookings: SwapMeetBooking[]
): number => getActiveSwapMeetBookings(bookings)
  .reduce((total, booking) => total + booking.stallCount, 0);

export const getSwapMeetAvailableStallCount = (
  bookings: SwapMeetBooking[],
  totalStallCount = SWAP_MEET_TOTAL_STALLS
): number => Math.max(0, totalStallCount - getSwapMeetBookedStallCount(bookings));

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
  bookedStallCount: number,
  totalStallCount = SWAP_MEET_TOTAL_STALLS
): SwapMeetValidationResult => {
  if (!Number.isInteger(requestedStallCount)) {
    return { valid: false, error: 'Please choose a whole number of half-tables.' };
  }

  if (requestedStallCount < 1) {
    return { valid: false, error: 'Please book at least one half-table.' };
  }

  if (requestedStallCount > SWAP_MEET_MAX_STALLS_PER_USER) {
    return {
      valid: false,
      error: `Each user can book up to ${SWAP_MEET_MAX_STALLS_PER_USER} half-tables.`,
    };
  }

  const availableAfterCurrentBooking =
    totalStallCount - bookedStallCount + existingStallCount;
  if (requestedStallCount > availableAfterCurrentBooking) {
    return {
      valid: false,
      error: `Only ${Math.max(0, availableAfterCurrentBooking)} half-tables are still available.`,
    };
  }

  return { valid: true };
};

export const buildSwapMeetBooking = (
  user: User,
  stallCount: number,
  existingBooking?: SwapMeetBooking | null,
  swapMeetId = 'local'
): SwapMeetBooking => {
  const now = Date.now();
  const isMember = user.isMember || user.isAdmin === true;
  const isRebookingCancelled = existingBooking?.status === 'cancelled';
  const amountOwed = calculateSwapMeetAmountOwed(stallCount, isMember);
  const isAutomaticallyPaid = amountOwed === 0;
  const paid = isAutomaticallyPaid || (isRebookingCancelled ? false : existingBooking?.paid ?? false);
  const invoiced = isRebookingCancelled ? false : existingBooking?.invoiced ?? false;

  return {
    id: existingBooking?.id ?? user.id,
    swapMeetId: existingBooking?.swapMeetId ?? swapMeetId,
    userId: user.id,
    userName: user.name,
    stallCount,
    status: paid ? 'confirmed' : 'pending',
    isMemberAtBooking: isMember,
    amountOwed,
    paid,
    invoiced,
    createdAt: existingBooking?.createdAt ?? now,
    updatedAt: now,
    ...(isAutomaticallyPaid ? { paidAt: now, paidBy: FREE_HALF_TABLE_PAYMENT_ID } : {}),
    ...(!isAutomaticallyPaid && !isRebookingCancelled && existingBooking?.paidAt !== undefined ? { paidAt: existingBooking.paidAt } : {}),
    ...(!isAutomaticallyPaid && !isRebookingCancelled && existingBooking?.paidBy !== undefined ? { paidBy: existingBooking.paidBy } : {}),
    ...(!isRebookingCancelled && existingBooking?.invoicedAt !== undefined ? { invoicedAt: existingBooking.invoicedAt } : {}),
    ...(!isRebookingCancelled && existingBooking?.invoicedBy !== undefined ? { invoicedBy: existingBooking.invoicedBy } : {}),
  };
};
