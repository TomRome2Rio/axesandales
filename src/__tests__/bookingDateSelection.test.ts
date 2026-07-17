import { describe, expect, it } from 'vitest';
import { resolveSelectedBookingDate } from '../utils/bookingDateSelection';

describe('resolveSelectedBookingDate', () => {
  it('uses the linked booking date when it is selectable', () => {
    const result = resolveSelectedBookingDate(
      [
        { value: '2026-07-19', isCancelled: false },
        { value: '2026-07-21', isCancelled: false },
      ],
      '',
      '2026-07-19'
    );

    expect(result).toBe('2026-07-19');
  });

  it('falls back to the earliest selectable date when nothing is selected yet', () => {
    const result = resolveSelectedBookingDate(
      [
        { value: '2026-07-19', isCancelled: false },
        { value: '2026-07-21', isCancelled: false },
      ],
      '',
      null
    );

    expect(result).toBe('2026-07-19');
  });

  it('keeps the current selection when it is still valid', () => {
    const result = resolveSelectedBookingDate(
      [
        { value: '2026-07-19', isCancelled: false },
        { value: '2026-07-21', isCancelled: false },
      ],
      '2026-07-21',
      null
    );

    expect(result).toBe('2026-07-21');
  });

  it('falls back to the earliest selectable date when the current selection is no longer valid', () => {
    const result = resolveSelectedBookingDate(
      [
        { value: '2026-07-19', isCancelled: false },
        { value: '2026-07-21', isCancelled: false },
      ],
      '2026-07-23',
      null
    );

    expect(result).toBe('2026-07-19');
  });

  it('ignores a linked booking date that is cancelled', () => {
    const result = resolveSelectedBookingDate(
      [
        { value: '2026-07-19', isCancelled: true },
        { value: '2026-07-21', isCancelled: false },
      ],
      '',
      '2026-07-19'
    );

    expect(result).toBe('2026-07-21');
  });
});
