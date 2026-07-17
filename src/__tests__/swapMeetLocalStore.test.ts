import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SwapMeetBooking, User } from '../types';

const makeUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  isMember: true,
  isAdmin: false,
  ...overrides,
});

const loadStore = async () => {
  vi.resetModules();
  return import('../services/swapMeetLocalStore');
};

describe('swapMeetLocalStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-01T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('notifies subscribers immediately and after saving bookings in name order', async () => {
    const store = await loadStore();
    const subscriber = vi.fn();

    const unsubscribe = store.subscribeLocalSwapMeetBookings(subscriber);
    await store.saveLocalSwapMeetBooking(makeUser({ id: 'user-b', name: 'Beta User' }), 2);
    await store.saveLocalSwapMeetBooking(makeUser({ id: 'user-a', name: 'Alpha User' }), 1);

    expect(subscriber).toHaveBeenCalledTimes(3);
    expect(subscriber.mock.calls[0][0]).toEqual([]);
    const latestBookings = subscriber.mock.calls[2][0] as SwapMeetBooking[];
    expect(latestBookings.map(booking => booking.userName)).toEqual([
      'Alpha User',
      'Beta User',
    ]);

    unsubscribe();
  });

  it('stops notifying unsubscribed listeners', async () => {
    const store = await loadStore();
    const subscriber = vi.fn();

    const unsubscribe = store.subscribeLocalSwapMeetBookings(subscriber);
    unsubscribe();
    await store.saveLocalSwapMeetBooking(makeUser(), 2);

    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it('updates paid, invoiced, and cancelled state for local bookings', async () => {
    const store = await loadStore();
    const subscriber = vi.fn();
    const admin = makeUser({ id: 'admin-1', name: 'Admin User', isAdmin: true });

    store.subscribeLocalSwapMeetBookings(subscriber);
    await store.saveLocalSwapMeetBooking(makeUser({ isMember: false }), 2);
    await store.markLocalSwapMeetBookingPaid('user-1', admin);
    await store.markLocalSwapMeetBookingInvoiced('user-1', admin);
    await store.cancelLocalSwapMeetBooking('user-1', admin);

    const latestCall = subscriber.mock.calls[subscriber.mock.calls.length - 1];
    const latestBooking = latestCall[0][0];
    expect(latestBooking).toMatchObject({
      id: 'user-1',
      paid: true,
      paidBy: 'admin-1',
      invoiced: true,
      invoicedBy: 'admin-1',
      status: 'cancelled',
      cancelledBy: 'admin-1',
    });
  });
});
