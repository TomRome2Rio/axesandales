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
  status: 'pending',
  isMemberAtBooking: true,
  amountOwed: 10,
  paid: false,
  invoiced: false,
  createdAt: 1000,
  updatedAt: 1000,
  ...overrides,
});

describe('calculateSwapMeetAmountOwed', () => {
  it('makes the first half-table free for members', () => {
    expect(calculateSwapMeetAmountOwed(1, true)).toBe(0);
    expect(calculateSwapMeetAmountOwed(4, true)).toBe(30);
  });

  it('charges non-members for every half-table', () => {
    expect(calculateSwapMeetAmountOwed(1, false)).toBe(10);
    expect(calculateSwapMeetAmountOwed(4, false)).toBe(40);
  });
});

describe('swap meet half-table counts', () => {
  it('sums booked half-tables and reports availability', () => {
    const bookings = [
      makeBooking({ stallCount: 2 }),
      makeBooking({ id: 'user-2', userId: 'user-2', stallCount: 3 }),
    ];

    expect(getSwapMeetBookedStallCount(bookings)).toBe(5);
    expect(getSwapMeetAvailableStallCount(bookings)).toBe(SWAP_MEET_TOTAL_STALLS - 5);
  });

  it('ignores cancelled bookings when counting half-tables', () => {
    const bookings = [
      makeBooking({ stallCount: 2 }),
      makeBooking({ id: 'user-2', userId: 'user-2', stallCount: 3, status: 'cancelled' }),
    ];

    expect(getSwapMeetBookedStallCount(bookings)).toBe(2);
    expect(getSwapMeetAvailableStallCount(bookings)).toBe(SWAP_MEET_TOTAL_STALLS - 2);
  });

  it('rejects more than four half-tables for one user', () => {
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
    expect(booking.status).toBe('pending');
    expect(booking.paid).toBe(false);
    expect(booking.invoiced).toBe(false);
  });

  it('automatically confirms a club member booking one free half-table', () => {
    const booking = buildSwapMeetBooking(makeUser({ isMember: true }), 1);

    expect(booking.amountOwed).toBe(0);
    expect(booking.status).toBe('confirmed');
    expect(booking.paid).toBe(true);
    expect(booking.paidAt).toBeGreaterThan(0);
    expect(booking.paidBy).toBe('system-free-club-member-half-table');
  });

  it('keeps a non-member booking one half-table pending payment', () => {
    const booking = buildSwapMeetBooking(makeUser({ isMember: false }), 1);

    expect(booking.amountOwed).toBe(10);
    expect(booking.status).toBe('pending');
    expect(booking.paid).toBe(false);
  });

  it('preserves paid and invoiced status when updating', () => {
    const existing = makeBooking({
      paid: true,
      status: 'confirmed',
      paidAt: 1234,
      paidBy: 'admin-1',
      invoiced: true,
      invoicedAt: 2345,
      invoicedBy: 'admin-1',
    });
    const updated = buildSwapMeetBooking(makeUser({ isMember: false }), 4, existing);

    expect(updated.createdAt).toBe(1000);
    expect(updated.status).toBe('confirmed');
    expect(updated.paid).toBe(true);
    expect(updated.paidAt).toBe(1234);
    expect(updated.invoiced).toBe(true);
    expect(updated.invoicedAt).toBe(2345);
    expect(updated.amountOwed).toBe(40);
  });

  it('auto-confirms a free booking when rebooking a cancelled booking', () => {
    const existing = makeBooking({
      status: 'cancelled',
      paid: true,
      paidAt: 1234,
      paidBy: 'admin-1',
    });
    const updated = buildSwapMeetBooking(makeUser({ isMember: true }), 1, existing);

    expect(updated.status).toBe('confirmed');
    expect(updated.paid).toBe(true);
    expect(updated.paidAt).toBeGreaterThan(0);
    expect(updated.amountOwed).toBe(0);
  });
});
