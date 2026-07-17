import { describe, expect, it } from 'vitest';
import {
  compareFirestoreDocumentIds,
  mergeTerrainBoxesWithDefaults,
  slugifyFirestoreId,
  sortFirestoreDocumentsById,
} from '../services/firebaseDocumentHelpers';
import { TerrainCategory, type TerrainBox } from '../types';

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

  it('merges missing terrain defaults while preserving existing boxes', () => {
    const existing: TerrainBox[] = [
      { id: 'terrain-a', name: 'Alpha', category: TerrainCategory.SCIFI, imageUrl: '' },
      { id: 'terrain-c', name: 'Charlie', category: TerrainCategory.SCIFI, imageUrl: '' },
    ];
    const defaults: TerrainBox[] = [
      { id: 'terrain-b', name: 'Bravo', category: TerrainCategory.SCIFI, imageUrl: '' },
      { id: 'terrain-c', name: 'Charlie', category: TerrainCategory.SCIFI, imageUrl: '' },
    ];

    const merged = mergeTerrainBoxesWithDefaults(existing, defaults);

    expect(merged.map(box => box.id)).toEqual(['terrain-a', 'terrain-b', 'terrain-c']);
  });
});
