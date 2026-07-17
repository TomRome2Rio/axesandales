import { describe, expect, it } from 'vitest';
import {
  applyMarkedUnavailableToggle,
  shouldAutoAddGameSystem,
} from '../utils/bookingFlowHelpers';

describe('shouldAutoAddGameSystem', () => {
  it('skips unavailable bookings', () => {
    expect(shouldAutoAddGameSystem({ gameSystem: 'Unavailable', markedUnavailable: true }, [])).toBe(false);
  });

  it('skips blank game systems', () => {
    expect(shouldAutoAddGameSystem({ gameSystem: '   ', markedUnavailable: false }, [])).toBe(false);
  });

  it('does not add systems that already exist, ignoring whitespace and casing', () => {
    expect(
      shouldAutoAddGameSystem(
        { gameSystem: 'Full spectrum dominance ', markedUnavailable: false },
        ['Full Spectrum Dominance']
      )
    ).toBe(false);
  });

  it('adds brand new systems', () => {
    expect(
      shouldAutoAddGameSystem(
        { gameSystem: 'Stargrave', markedUnavailable: false },
        ['Warhammer 40k']
      )
    ).toBe(true);
  });
});

describe('applyMarkedUnavailableToggle', () => {
  it('forces unavailable placeholder values when enabled', () => {
    const result = applyMarkedUnavailableToggle(
      {
        gameSystem: 'Warhammer 40k',
        playerCount: 4,
        playerCountManuallySet: false,
        taggedPlayerIds: ['user-2', 'user-3'],
      },
      true
    );

    expect(result).toEqual({
      gameSystem: 'Unavailable',
      playerCount: 0,
      playerCountManuallySet: true,
      taggedPlayerIds: [],
    });
  });

  it('restores editable state when disabled', () => {
    const result = applyMarkedUnavailableToggle(
      {
        gameSystem: 'Unavailable',
        playerCount: 0,
        playerCountManuallySet: true,
        taggedPlayerIds: [],
      },
      false
    );

    expect(result).toEqual({
      gameSystem: '',
      playerCount: 2,
      playerCountManuallySet: false,
      taggedPlayerIds: [],
    });
  });

  it('keeps existing non-placeholder values when disabled', () => {
    const result = applyMarkedUnavailableToggle(
      {
        gameSystem: 'Warhammer 40k',
        playerCount: 5,
        playerCountManuallySet: true,
        taggedPlayerIds: ['user-2'],
      },
      false
    );

    expect(result).toEqual({
      gameSystem: 'Warhammer 40k',
      playerCount: 5,
      playerCountManuallySet: false,
      taggedPlayerIds: ['user-2'],
    });
  });
});
