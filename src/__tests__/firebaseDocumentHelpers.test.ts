import { describe, expect, it } from 'vitest';
import {
  compareFirestoreDocumentIds,
  slugifyFirestoreId,
  sortFirestoreDocumentsById,
} from '../services/firebaseDocumentHelpers';

describe('firebaseDocumentHelpers', () => {
  it('slugifies firestore ids consistently', () => {
    expect(slugifyFirestoreId('Game Systems!')).toBe('game-systems');
    expect(slugifyFirestoreId('  Terrain Box 13  ')).toBe('terrain-box-13');
  });

  it('sorts firestore document ids by prefix and numeric suffix', () => {
    expect(compareFirestoreDocumentIds('L2', 'L10')).toBeLessThan(0);
    expect(compareFirestoreDocumentIds('terrain-2', 'table-1')).toBeGreaterThan(0);

    const docs = sortFirestoreDocumentsById([
      { id: 'L10' },
      { id: 'L2' },
      { id: 'S1' },
      { id: 'L1' },
    ]);

    expect(docs.map(doc => doc.id)).toEqual(['L1', 'L2', 'L10', 'S1']);
  });
});
