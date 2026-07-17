import { describe, expect, it } from 'vitest';
import { chunkArray } from '../utils/gameSystemRename';

describe('gameSystemRename helpers', () => {
  it('splits large booking lists into Firestore-safe chunks', () => {
    const items = Array.from({ length: 451 }, (_, index) => index);
    const chunks = chunkArray(items, 450);

    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toHaveLength(450);
    expect(chunks[1]).toHaveLength(1);
  });

  it('rejects non-positive chunk sizes', () => {
    expect(() => chunkArray([1, 2, 3], 0)).toThrow(/greater than 0/i);
  });
});
