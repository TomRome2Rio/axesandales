import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type Booking } from '../types';

const firestoreMocks = vi.hoisted(() => {
  const doc = vi.fn((first: { path?: string } | unknown, ...segments: string[]) => {
    if (segments.length === 0) {
      const parentPath = typeof first === 'object' && first && 'path' in first ? String(first.path) : 'generated';
      return { id: 'generated-id', path: `${parentPath}/generated-id` };
    }
    const path = segments.join('/');
    return { id: segments[segments.length - 1], path };
  });

  const collection = vi.fn((_db: unknown, path: string) => ({ path }));

  return {
    collection,
    deleteDoc: vi.fn(),
    doc,
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    onSnapshot: vi.fn(),
    orderBy: vi.fn((field: string, direction?: string) => ({ field, direction })),
    query: vi.fn((...parts: unknown[]) => ({ parts })),
    runTransaction: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    where: vi.fn((field: string, op: string, value: unknown) => ({ field, op, value })),
    writeBatch: vi.fn(),
  };
});

vi.mock('../firebaseConfig', () => ({
  auth: { currentUser: null },
  db: { app: 'test-app' },
}));

vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  updatePassword: vi.fn(),
}));

vi.mock('firebase/firestore', () => firestoreMocks);

const makeDoc = (id: string, data: Record<string, unknown>) => ({
  id,
  data: () => data,
});

const makeBooking = (overrides: Partial<Booking> = {}): Booking => ({
  id: 'booking-1',
  date: '2026-03-10',
  tableId: 'L1',
  terrainBoxId: null,
  secondaryTerrainId: null,
  memberName: 'Test User',
  memberId: 'user-1',
  gameSystem: 'Warhammer 40k',
  playerCount: 2,
  taggedPlayerIds: [],
  markedUnavailable: false,
  timestamp: 1000,
  status: 'active',
  ...overrides,
});

describe('firebaseService Firebase adapter behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    firestoreMocks.writeBatch.mockImplementation(() => ({
      commit: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn(),
      set: vi.fn(),
      update: vi.fn(),
    }));
  });

  it('checks latest active bookings and rejects conflicting saves before writing', async () => {
    const { saveBooking } = await import('../services/firebaseService');
    firestoreMocks.getDocs.mockResolvedValueOnce({
      docs: [
        makeDoc('other-booking', {
          ...makeBooking({
            id: 'other-booking',
            memberName: 'Other User',
          }),
        }),
      ],
    });

    await expect(saveBooking(makeBooking({ id: 'new-booking' }))).rejects.toMatchObject({
      name: 'BookingConflictError',
      message: expect.stringContaining('That table has just been booked by Other User.'),
    });

    expect(firestoreMocks.setDoc).not.toHaveBeenCalled();
    expect(firestoreMocks.where).toHaveBeenCalledWith('date', '==', '2026-03-10');
    expect(firestoreMocks.where).toHaveBeenCalledWith('status', '==', 'active');
  });

  it('renames game systems in Firestore metadata and matching booking batches', async () => {
    const { renameGameSystem } = await import('../services/firebaseService');
    const matchingDocs = Array.from({ length: 451 }, (_unused, index) => (
      makeDoc(`booking-${index}`, { gameSystem: 'Old Hammer' })
    ));
    const ignoredDoc = makeDoc('booking-ignored', { gameSystem: 'Other Game' });
    const firstBatch = {
      commit: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn(),
      set: vi.fn(),
      update: vi.fn(),
    };
    const secondBatch = {
      commit: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn(),
      set: vi.fn(),
      update: vi.fn(),
    };
    firestoreMocks.getDocs.mockResolvedValueOnce({ docs: [...matchingDocs, ignoredDoc] });
    firestoreMocks.writeBatch
      .mockReturnValueOnce(firstBatch)
      .mockReturnValueOnce(secondBatch);

    await renameGameSystem('Old Hammer', 'New Hammer');

    expect(firstBatch.delete).toHaveBeenCalledWith({ id: 'old-hammer', path: 'gameSystems/old-hammer' });
    expect(firstBatch.set).toHaveBeenCalledWith(
      { id: 'new-hammer', path: 'gameSystems/new-hammer' },
      { name: 'New Hammer' }
    );
    expect(firstBatch.update).toHaveBeenCalledTimes(450);
    expect(secondBatch.update).toHaveBeenCalledTimes(1);
    expect(firstBatch.commit).toHaveBeenCalledTimes(1);
    expect(secondBatch.commit).toHaveBeenCalledTimes(1);
    expect(firstBatch.update).not.toHaveBeenCalledWith(
      { id: 'booking-ignored', path: 'bookings/booking-ignored' },
      { gameSystem: 'New Hammer' }
    );
  });

});
