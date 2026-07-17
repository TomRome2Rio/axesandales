import { describe, expect, it } from 'vitest';
import { isStatsVisibleBooking } from '../utils/statsHelpers';

describe('isStatsVisibleBooking', () => {
  it('hides unavailable bookings from stats', () => {
    expect(isStatsVisibleBooking({
      status: 'active',
      gameSystem: 'Unavailable',
      markedUnavailable: true,
    } as never)).toBe(false);
  });

  it('hides placeholder game system names from stats', () => {
    expect(isStatsVisibleBooking({
      status: 'active',
      gameSystem: 'Not Available',
      markedUnavailable: false,
    } as never)).toBe(false);
  });

  it('keeps normal bookings visible', () => {
    expect(isStatsVisibleBooking({
      status: 'active',
      gameSystem: 'Warhammer 40k',
      markedUnavailable: false,
    } as never)).toBe(true);
  });
});
