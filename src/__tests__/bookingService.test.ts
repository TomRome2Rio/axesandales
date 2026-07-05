import { describe, it, expect } from 'vitest';
import {
  validateBooking,
  createBookingFromInput,
  sanitizeBookingForFirestore,
  canModifyBooking,
  buildCancellationUpdate,
  getSecondaryTerrainStatus,
  BookingInput,
  BookingValidationContext,
} from '../services/bookingService';
import { Booking, TerrainBox, User } from '../types';

// ─── Test helpers ───────────────────────────────────────

const makeUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  isMember: true,
  isAdmin: false,
  ...overrides,
});

const makeInput = (overrides: Partial<BookingInput> = {}): BookingInput => ({
  date: '2026-03-10',
  tableId: 'L1',
  terrainBoxId: '',
  gameSystem: 'Warhammer 40k',
  playerCount: 2,
  taggedPlayerIds: [],
  ...overrides,
});

const makeBooking = (overrides: Partial<Booking> = {}): Booking => ({
  id: 'booking-1',
  date: '2026-03-10',
  tableId: 'L1',
  terrainBoxId: null,
  memberName: 'Other User',
  memberId: 'user-2',
  gameSystem: 'Warhammer 40k',
  playerCount: 2,
  taggedPlayerIds: [],
  timestamp: 1000,
  status: 'active',
  ...overrides,
});

const makeContext = (overrides: Partial<BookingValidationContext> = {}): BookingValidationContext => ({
  cancelledDates: [],
  user: makeUser(),
  existingBookings: [],
  ...overrides,
});

// ─── validateBooking ────────────────────────────────────

describe('validateBooking', () => {
  it('accepts a valid booking', () => {
    const result = validateBooking(makeInput(), makeContext());
    expect(result).toEqual({ valid: true });
  });

  it('rejects a booking on a cancelled date', () => {
    const result = validateBooking(
      makeInput(),
      makeContext({ cancelledDates: ['2026-03-10'] })
    );
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/cancelled/i);
  });

  it('rejects a booking from a non-member', () => {
    const result = validateBooking(
      makeInput(),
      makeContext({ user: makeUser({ isMember: false }) })
    );
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/membership/i);
  });

  it('rejects when no table is selected', () => {
    const result = validateBooking(
      makeInput({ tableId: '' }),
      makeContext()
    );
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/table/i);
  });

  it('rejects when no game system is entered', () => {
    const result = validateBooking(
      makeInput({ gameSystem: '' }),
      makeContext()
    );
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/game system/i);
  });

  it('rejects when the table is already booked on that date', () => {
    const existing = makeBooking({ id: 'other-booking', tableId: 'L1', date: '2026-03-10' });
    const result = validateBooking(
      makeInput({ tableId: 'L1', date: '2026-03-10' }),
      makeContext({ existingBookings: [existing] })
    );
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/already booked/i);
  });

  it('allows the same table when editing that booking', () => {
    const existing = makeBooking({ id: 'booking-1', tableId: 'L1', date: '2026-03-10' });
    const result = validateBooking(
      makeInput({ tableId: 'L1', date: '2026-03-10' }),
      makeContext({ existingBookings: [existing], editingBookingId: 'booking-1' })
    );
    expect(result.valid).toBe(true);
  });

  it('allows a table booked on a different date', () => {
    const existing = makeBooking({ tableId: 'L1', date: '2026-03-17' });
    const result = validateBooking(
      makeInput({ tableId: 'L1', date: '2026-03-10' }),
      makeContext({ existingBookings: [existing] })
    );
    expect(result.valid).toBe(true);
  });

  it('ignores cancelled bookings when checking table conflicts', () => {
    const cancelled = makeBooking({ tableId: 'L1', date: '2026-03-10', status: 'cancelled' });
    const result = validateBooking(
      makeInput({ tableId: 'L1', date: '2026-03-10' }),
      makeContext({ existingBookings: [cancelled] })
    );
    expect(result.valid).toBe(true);
  });

  it('rejects when terrain is already reserved on that date', () => {
    const existing = makeBooking({ terrainBoxId: 'terrain-1', date: '2026-03-10' });
    const result = validateBooking(
      makeInput({ terrainBoxId: 'terrain-1', date: '2026-03-10', tableId: 'L2' }),
      makeContext({ existingBookings: [existing] })
    );
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/terrain.*reserved/i);
  });

  it('allows terrain reserved on a different date', () => {
    const existing = makeBooking({ terrainBoxId: 'terrain-1', date: '2026-03-17' });
    const result = validateBooking(
      makeInput({ terrainBoxId: 'terrain-1', date: '2026-03-10', tableId: 'L2' }),
      makeContext({ existingBookings: [existing] })
    );
    expect(result.valid).toBe(true);
  });

  it('allows no-terrain booking even if terrain is taken', () => {
    const existing = makeBooking({ terrainBoxId: 'terrain-1', date: '2026-03-10' });
    const result = validateBooking(
      makeInput({ terrainBoxId: '', date: '2026-03-10', tableId: 'L2' }),
      makeContext({ existingBookings: [existing] })
    );
    expect(result.valid).toBe(true);
  });

  it('allows a secondary terrain item when fewer than five copies are already booked', () => {
    const existing = Array.from({ length: 4 }, (_, index) => makeBooking({
      id: `footprint-${index}`,
      date: '2026-03-10',
      terrainBoxId: null,
      secondaryTerrainId: '40K-FOOTPRINTS',
      memberId: `user-${index + 2}`,
    }));
    const result = validateBooking(
      makeInput({ date: '2026-03-10', tableId: 'L2', secondaryTerrainId: '40K-FOOTPRINTS' }),
      makeContext({ existingBookings: existing })
    );
    expect(result.valid).toBe(true);
  });

  it('rejects a secondary terrain item when all five copies are already booked', () => {
    const existing = Array.from({ length: 5 }, (_, index) => makeBooking({
      id: `footprint-${index}`,
      date: '2026-03-10',
      terrainBoxId: null,
      secondaryTerrainId: '40K-FOOTPRINTS',
      memberId: `user-${index + 2}`,
    }));
    const result = validateBooking(
      makeInput({ date: '2026-03-10', tableId: 'L2', secondaryTerrainId: '40K-FOOTPRINTS' }),
      makeContext({ existingBookings: existing })
    );
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/fully booked/i);
  });
});

describe('getSecondaryTerrainStatus', () => {
  const box: TerrainBox = {
    id: '40K-FOOTPRINTS',
    category: 'Warhammer 40k' as never,
    name: '40k Footprints',
    imageUrl: '',
    maxBookingsPerNight: 3,
  };

  it('reports when a secondary terrain item is fully booked', () => {
    const bookings = Array.from({ length: 3 }, (_, index) => makeBooking({
      id: `footprint-${index}`,
      secondaryTerrainId: box.id,
      memberId: `user-${index + 2}`,
    }));

    const status = getSecondaryTerrainStatus(box, bookings, 'user-1');

    expect(status.isFull).toBe(true);
    expect(status.availableCount).toBe(0);
  });

  it('reports when the current user already has that secondary terrain booked', () => {
    const bookings = [
      makeBooking({ id: 'mine', secondaryTerrainId: box.id, memberId: 'user-1' }),
      makeBooking({ id: 'other', secondaryTerrainId: box.id, memberId: 'user-2' }),
    ];

    const status = getSecondaryTerrainStatus(box, bookings, 'user-1');

    expect(status.isBookedByUser).toBe(true);
    expect(status.booking?.memberId).toBe('user-1');
  });
});

// ─── createBookingFromInput ─────────────────────────────

describe('createBookingFromInput', () => {
  it('creates a new booking with active status and a generated ID', () => {
    const user = makeUser();
    const input = makeInput({ taggedPlayerIds: ['user-3'] });
    const booking = createBookingFromInput(input, user);

    expect(booking.id).toBeTruthy();
    expect(booking.date).toBe('2026-03-10');
    expect(booking.tableId).toBe('L1');
    expect(booking.terrainBoxId).toBeNull(); // empty string -> null
    expect(booking.memberName).toBe('Test User');
    expect(booking.memberId).toBe('user-1');
    expect(booking.gameSystem).toBe('Warhammer 40k');
    expect(booking.playerCount).toBe(2);
    expect(booking.taggedPlayerIds).toEqual(['user-3']);
    expect(booking.status).toBe('active');
    expect(booking.timestamp).toBeGreaterThan(0);
  });

  it('preserves existing ID and status when editing', () => {
    const existingBooking = makeBooking({ id: 'existing-id', status: 'active' });
    const user = makeUser();
    const input = makeInput({ gameSystem: 'Age of Sigmar' });
    const booking = createBookingFromInput(input, user, existingBooking);

    expect(booking.id).toBe('existing-id');
    expect(booking.status).toBe('active');
    expect(booking.gameSystem).toBe('Age of Sigmar');
  });

  it('sets terrainBoxId to null when no terrain selected', () => {
    const booking = createBookingFromInput(makeInput({ terrainBoxId: '' }), makeUser());
    expect(booking.terrainBoxId).toBeNull();
  });

  it('preserves terrainBoxId when terrain is selected', () => {
    const booking = createBookingFromInput(makeInput({ terrainBoxId: 'terrain-1' }), makeUser());
    expect(booking.terrainBoxId).toBe('terrain-1');
  });

  it('preserves secondaryTerrainId when a secondary terrain item is selected', () => {
    const booking = createBookingFromInput(makeInput({ secondaryTerrainId: '40K-FOOTPRINTS' }), makeUser());
    expect(booking.secondaryTerrainId).toBe('40K-FOOTPRINTS');
  });

  it('always sets taggedPlayerIds as an array, never undefined', () => {
    const booking = createBookingFromInput(makeInput({ taggedPlayerIds: [] }), makeUser());
    expect(booking.taggedPlayerIds).toEqual([]);
    expect(booking.taggedPlayerIds).not.toBeUndefined();
  });
});

// ─── sanitizeBookingForFirestore ────────────────────────

describe('sanitizeBookingForFirestore', () => {
  it('returns a booking with no undefined values', () => {
    const booking = makeBooking();
    const sanitized = sanitizeBookingForFirestore(booking);

    // Check every field is defined
    for (const [key, value] of Object.entries(sanitized)) {
      expect(value, `field '${key}' should not be undefined`).not.toBeUndefined();
    }
  });

  it('converts undefined taggedPlayerIds to empty array', () => {
    // Simulate old data loaded from Firestore that may lack taggedPlayerIds
    const raw = { ...makeBooking() } as Record<string, unknown>;
    delete raw.taggedPlayerIds;
    const sanitized = sanitizeBookingForFirestore(raw as unknown as Booking);
    expect(sanitized.taggedPlayerIds).toEqual([]);
  });

  it('converts undefined terrainBoxId to null', () => {
    const raw = { ...makeBooking() } as Record<string, unknown>;
    delete raw.terrainBoxId;
    const sanitized = sanitizeBookingForFirestore(raw as unknown as Booking);
    expect(sanitized.terrainBoxId).toBeNull();
  });

  it('preserves cancellation metadata when present', () => {
    const booking = makeBooking({
      status: 'cancelled',
      cancelledAt: 12345,
      cancelledBy: 'admin-1',
    });
    const sanitized = sanitizeBookingForFirestore(booking);
    expect(sanitized.cancelledAt).toBe(12345);
    expect(sanitized.cancelledBy).toBe('admin-1');
  });

  it('omits cancellation metadata when not present', () => {
    const booking = makeBooking();
    const sanitized = sanitizeBookingForFirestore(booking);
    expect('cancelledAt' in sanitized).toBe(false);
    expect('cancelledBy' in sanitized).toBe(false);
  });
});

// ─── canModifyBooking ───────────────────────────────────

describe('canModifyBooking', () => {
  it('allows the booking owner to modify', () => {
    const booking = makeBooking({ memberId: 'user-1' });
    const owner = makeUser({ id: 'user-1' });
    expect(canModifyBooking(booking, owner)).toBe(true);
  });

  it('allows an admin to modify any booking', () => {
    const booking = makeBooking({ memberId: 'user-2' });
    const admin = makeUser({ id: 'admin-1', isAdmin: true });
    expect(canModifyBooking(booking, admin)).toBe(true);
  });

  it('denies a different non-admin user', () => {
    const booking = makeBooking({ memberId: 'user-2' });
    const other = makeUser({ id: 'user-3', isAdmin: false });
    expect(canModifyBooking(booking, other)).toBe(false);
  });

  it('denies when user is null (logged out)', () => {
    const booking = makeBooking();
    expect(canModifyBooking(booking, null)).toBe(false);
  });
});

// ─── buildCancellationUpdate ────────────────────────────

describe('buildCancellationUpdate', () => {
  it('returns status cancelled with timestamp and userId', () => {
    const before = Date.now();
    const update = buildCancellationUpdate('user-1');
    const after = Date.now();

    expect(update.status).toBe('cancelled');
    expect(update.cancelledBy).toBe('user-1');
    expect(update.cancelledAt).toBeGreaterThanOrEqual(before);
    expect(update.cancelledAt).toBeLessThanOrEqual(after);
  });

  it('contains no undefined values', () => {
    const update = buildCancellationUpdate('admin-1');
    for (const [key, value] of Object.entries(update)) {
      expect(value, `field '${key}' should not be undefined`).not.toBeUndefined();
    }
  });
});

// ─── Editing-specific scenarios ─────────────────────────

describe('booking edits', () => {
  it('allows changing game system on an existing booking', () => {
    const existing = makeBooking({ id: 'b1', tableId: 'L1', date: '2026-03-10', gameSystem: 'Warhammer 40k' });
    const input = makeInput({ tableId: 'L1', date: '2026-03-10', gameSystem: 'Age of Sigmar' });
    const result = validateBooking(input, makeContext({ existingBookings: [existing], editingBookingId: 'b1' }));
    expect(result.valid).toBe(true);

    const updated = createBookingFromInput(input, makeUser(), existing);
    expect(updated.id).toBe('b1');
    expect(updated.gameSystem).toBe('Age of Sigmar');
  });

  it('allows moving to a different table when editing', () => {
    const existing = makeBooking({ id: 'b1', tableId: 'L1', date: '2026-03-10' });
    const input = makeInput({ tableId: 'L2', date: '2026-03-10' });
    const result = validateBooking(input, makeContext({ existingBookings: [existing], editingBookingId: 'b1' }));
    expect(result.valid).toBe(true);
  });

  it('rejects moving to a table already taken by someone else', () => {
    const myBooking = makeBooking({ id: 'b1', tableId: 'L1', date: '2026-03-10', memberId: 'user-1' });
    const otherBooking = makeBooking({ id: 'b2', tableId: 'L2', date: '2026-03-10', memberId: 'user-2' });
    const input = makeInput({ tableId: 'L2', date: '2026-03-10' });
    const result = validateBooking(input, makeContext({ existingBookings: [myBooking, otherBooking], editingBookingId: 'b1' }));
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/already booked/i);
  });

  it('allows changing terrain when editing', () => {
    const existing = makeBooking({ id: 'b1', tableId: 'L1', terrainBoxId: 'terrain-1', date: '2026-03-10' });
    const input = makeInput({ tableId: 'L1', terrainBoxId: 'terrain-2', date: '2026-03-10' });
    const result = validateBooking(input, makeContext({ existingBookings: [existing], editingBookingId: 'b1' }));
    expect(result.valid).toBe(true);
  });

  it('rejects changing to terrain already taken by someone else', () => {
    const myBooking = makeBooking({ id: 'b1', tableId: 'L1', terrainBoxId: 'terrain-1', date: '2026-03-10' });
    const otherBooking = makeBooking({ id: 'b2', tableId: 'L2', terrainBoxId: 'terrain-2', date: '2026-03-10' });
    const input = makeInput({ tableId: 'L1', terrainBoxId: 'terrain-2', date: '2026-03-10' });
    const result = validateBooking(input, makeContext({ existingBookings: [myBooking, otherBooking], editingBookingId: 'b1' }));
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/terrain.*reserved/i);
  });

  it('preserves the original status when editing', () => {
    const existing = makeBooking({ id: 'b1', status: 'active' });
    const updated = createBookingFromInput(makeInput(), makeUser(), existing);
    expect(updated.status).toBe('active');
  });

  it('preserves player count and tagged players when editing', () => {
    const existing = makeBooking({ id: 'b1' });
    const input = makeInput({ playerCount: 5, taggedPlayerIds: ['user-3', 'user-4'] });
    const updated = createBookingFromInput(input, makeUser(), existing);
    expect(updated.playerCount).toBe(5);
    expect(updated.taggedPlayerIds).toEqual(['user-3', 'user-4']);
  });
});
