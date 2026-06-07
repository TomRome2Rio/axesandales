import { describe, expect, it } from 'vitest';
import {
  buildSwapMeetBooking,
  calculateSwapMeetAmountOwed,
  getSwapMeetAvailableStallCount,
  getSwapMeetBookedStallCount,
  SWAP_MEET_TOTAL_STALLS,
  validateSwapMeetStallCount,
} from '../services/swapMeetService';
import { SwapMeetBooking, User } from '../types';

const makeUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  isMember: true,
  isAdmin: false,
  ...overrides,
});

const makeBooking = (overrides: Partial<SwapMeetBooking> = {}): SwapMeetBooking => ({
  id: 'user-1',
  userId: 'user-1',
  userName: 'Test User',
  stallCount: 2,
  isMemberAtBooking: true,
  amountOwed: 10,
  paid: false,
  invoiced: false,
  createdAt: 1000,
  updatedAt: 1000,
  ...overrides,
});

describe('calculateSwapMeetAmountOwed', () => {
  it('makes the first stall free for members', () => {
    expect(calculateSwapMeetAmountOwed(1, true)).toBe(0);
    expect(calculateSwapMeetAmountOwed(4, true)).toBe(30);
  });

  it('charges non-members for every stall', () => {
    expect(calculateSwapMeetAmountOwed(1, false)).toBe(10);
    expect(calculateSwapMeetAmountOwed(4, false)).toBe(40);
  });
});

describe('swap meet stall counts', () => {
  it('sums booked stalls and reports availability', () => {
    const bookings = [
      makeBooking({ stallCount: 2 }),
      makeBooking({ id: 'user-2', userId: 'user-2', stallCount: 3 }),
    ];

    expect(getSwapMeetBookedStallCount(bookings)).toBe(5);
    expect(getSwapMeetAvailableStallCount(bookings)).toBe(SWAP_MEET_TOTAL_STALLS - 5);
  });

  it('rejects more than four stalls for one user', () => {
    const result = validateSwapMeetStallCount(5, 0, 0);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/up to 4/i);
  });

  it('allows updating an existing booking using its current capacity', () => {
    const result = validateSwapMeetStallCount(4, 3, 29);
    expect(result.valid).toBe(true);
  });

  it('rejects bookings that exceed remaining capacity', () => {
    const result = validateSwapMeetStallCount(2, 0, 29);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/only 1/i);
  });
});

describe('buildSwapMeetBooking', () => {
  it('creates a booking with calculated amount owed', () => {
    const booking = buildSwapMeetBooking(makeUser({ isMember: true }), 3);

    expect(booking.id).toBe('user-1');
    expect(booking.userId).toBe('user-1');
    expect(booking.stallCount).toBe(3);
    expect(booking.amountOwed).toBe(20);
    expect(booking.paid).toBe(false);
    expect(booking.invoiced).toBe(false);
  });

  it('preserves paid and invoiced status when updating', () => {
    const existing = makeBooking({
      paid: true,
      paidAt: 1234,
      paidBy: 'admin-1',
      invoiced: true,
      invoicedAt: 2345,
      invoicedBy: 'admin-1',
    });
    const updated = buildSwapMeetBooking(makeUser({ isMember: false }), 4, existing);

    expect(updated.createdAt).toBe(1000);
    expect(updated.paid).toBe(true);
    expect(updated.paidAt).toBe(1234);
    expect(updated.invoiced).toBe(true);
    expect(updated.invoicedAt).toBe(2345);
    expect(updated.amountOwed).toBe(40);
  });
});
