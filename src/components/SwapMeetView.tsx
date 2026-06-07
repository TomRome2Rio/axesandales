import React, { useEffect, useMemo, useState } from 'react';
import { SwapMeetBooking, User } from '../types';
import {
  calculateSwapMeetAmountOwed,
  getSwapMeetAvailableStallCount,
  getSwapMeetBookedStallCount,
  SWAP_MEET_DATE,
  SWAP_MEET_MAX_STALLS_PER_USER,
  SWAP_MEET_STALL_PRICE,
  validateSwapMeetStallCount,
} from '../services/swapMeetService';

interface SwapMeetViewProps {
  user: User | null;
  users: User[];
  bookings: SwapMeetBooking[];
  onLogin: () => void;
  onBookStalls: (stallCount: number) => Promise<void>;
  onMarkPaid: (bookingId: string) => Promise<void>;
  onMarkInvoiced: (bookingId: string) => Promise<void>;
}

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (date: string): string =>
  new Date(date + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const downloadCsv = (
  filename: string,
  rows: { email: string; stalls: number; amountOwed: number }[]
) => {
  const escapeCell = (value: string | number) => {
    const text = String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const lines = [
    ['email', 'tables_booked', 'amount_owed'],
    ...rows.map(row => [row.email, row.stalls, row.amountOwed]),
  ];
  const csv = lines.map(row => row.map(escapeCell).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const SwapMeetView: React.FC<SwapMeetViewProps> = ({
  user,
  users,
  bookings,
  onLogin,
  onBookStalls,
  onMarkPaid,
  onMarkInvoiced,
}) => {
  const myBooking = user ? bookings.find(booking => booking.userId === user.id) : undefined;
  const bookedStallCount = getSwapMeetBookedStallCount(bookings);
  const availableStallCount = getSwapMeetAvailableStallCount(bookings);
  const initialSelection = myBooking?.stallCount ?? 1;
  const [selectedStallCount, setSelectedStallCount] = useState(initialSelection);
  const [saving, setSaving] = useState(false);
  const [adminBusyId, setAdminBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const selectedAmountOwed = user
    ? calculateSwapMeetAmountOwed(selectedStallCount, user.isMember || user.isAdmin === true)
    : 0;
  const existingStallCount = myBooking?.stallCount ?? 0;
  const maxSelectableStalls = Math.min(
    SWAP_MEET_MAX_STALLS_PER_USER,
    existingStallCount + availableStallCount
  );

  const usersById = useMemo(() => {
    const map = new Map<string, User>();
    users.forEach(u => map.set(u.id, u));
    return map;
  }, [users]);

  const adminRows = useMemo(
    () => bookings
      .filter(booking => booking.stallCount > 0)
      .map(booking => {
        const bookingUser = usersById.get(booking.userId);
        return {
          booking,
          email: bookingUser?.email ?? '',
          name: bookingUser?.name ?? booking.userName,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
    [bookings, usersById]
  );

  const owedRows = adminRows.filter(row => row.booking.amountOwed > 0);
  const unpaidRows = owedRows.filter(row => !row.booking.paid);
  const uninvoicedRows = owedRows.filter(row => !row.booking.invoiced);

  useEffect(() => {
    setSelectedStallCount(myBooking?.stallCount ?? 1);
  }, [myBooking?.stallCount]);

  const handleSave = async () => {
    if (!user) return;
    const validation = validateSwapMeetStallCount(
      selectedStallCount,
      existingStallCount,
      bookedStallCount
    );
    if (!validation.valid) {
      setMessage(validation.error ?? 'Please choose a valid stall count.');
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      await onBookStalls(selectedStallCount);
      setMessage('Swap meet stalls booked.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save the booking.');
    } finally {
      setSaving(false);
    }
  };

  const handleAdminAction = async (
    bookingId: string,
    action: (id: string) => Promise<void>
  ) => {
    setAdminBusyId(bookingId);
    setMessage(null);
    try {
      await action(bookingId);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update booking.');
    } finally {
      setAdminBusyId(null);
    }
  };

  const exportRows = (
    filename: string,
    rows: typeof adminRows
  ) => {
    downloadCsv(filename, rows.map(row => ({
      email: row.email,
      stalls: row.booking.stallCount,
      amountOwed: row.booking.amountOwed,
    })));
  };

  return (
    <div className="space-y-8">
      <section className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div>
            <p className="text-sm font-semibold text-amber-400 uppercase tracking-wide">Bring-and-buy</p>
            <h1 className="text-3xl font-bold text-white mt-2">Swap Meet</h1>
            <p className="text-neutral-400 mt-3 max-w-2xl">
              Book up to {SWAP_MEET_MAX_STALLS_PER_USER} stalls for the day. Stalls are {formatCurrency(SWAP_MEET_STALL_PRICE)} each, and club members get their first stall free.
            </p>
          </div>
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 min-w-[220px]">
            <div className="text-sm text-neutral-500">Date</div>
            <div className="text-xl font-bold text-amber-300 mt-1">{formatDate(SWAP_MEET_DATE)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
            <div className="text-sm text-neutral-500">Stalls available</div>
            <div className="text-3xl font-bold text-white mt-1">{availableStallCount}</div>
            <div className="text-xs text-neutral-500 mt-1">{bookedStallCount} of 30 booked</div>
          </div>
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
            <div className="text-sm text-neutral-500">Your stalls</div>
            <div className="text-3xl font-bold text-white mt-1">{myBooking?.stallCount ?? 0}</div>
            <div className="text-xs text-neutral-500 mt-1">{user ? 'Booked' : 'Sign in to book'}</div>
          </div>
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
            <div className="text-sm text-neutral-500">Your current total</div>
            <div className="text-3xl font-bold text-white mt-1">{formatCurrency(myBooking?.amountOwed ?? 0)}</div>
            <div className="text-xs text-neutral-500 mt-1">{myBooking?.paid ? 'Paid' : 'Payable on invoice'}</div>
          </div>
        </div>
      </section>

      <section className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-6">
        {!user ? (
          <div className="flex justify-center">
            <button
              onClick={onLogin}
              className="bg-amber-600 hover:bg-amber-500 text-black font-semibold px-4 py-2 rounded-lg"
            >
              Sign in to book stalls
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Book Stalls</h2>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: SWAP_MEET_MAX_STALLS_PER_USER }, (_, index) => index + 1).map(count => {
                const disabled = count > maxSelectableStalls;
                return (
                  <button
                    key={count}
                    onClick={() => setSelectedStallCount(count)}
                    disabled={disabled}
                    className={`w-14 h-12 rounded-lg border text-lg font-bold transition-colors ${
                      selectedStallCount === count
                        ? 'bg-amber-600 border-amber-500 text-black'
                        : 'bg-neutral-900 border-neutral-700 text-neutral-200 hover:border-neutral-500'
                    } ${disabled ? 'opacity-40 cursor-not-allowed hover:border-neutral-700' : ''}`}
                  >
                    {count}
                  </button>
                );
              })}
            </div>
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="text-sm text-neutral-400">Selected booking</div>
                <div className="text-white font-semibold mt-1">
                  {selectedStallCount} {selectedStallCount === 1 ? 'stall' : 'stalls'} for {formatCurrency(selectedAmountOwed)}
                </div>
                {(user.isMember || user.isAdmin) && (
                  <div className="text-xs text-green-400 mt-1">First stall free for club members.</div>
                )}
              </div>
              <button
                onClick={handleSave}
                disabled={saving || selectedStallCount > maxSelectableStalls}
                className="bg-amber-600 hover:bg-amber-500 disabled:bg-neutral-700 disabled:text-neutral-500 text-black font-semibold px-5 py-2 rounded-lg"
              >
                {saving ? 'Saving...' : myBooking ? 'Update Booking' : 'Book Stalls'}
              </button>
            </div>
          </div>
        )}
        {message && (
          <div className="mt-4 text-sm text-amber-300 bg-amber-900/20 border border-amber-800/40 rounded-lg px-3 py-2">
            {message}
          </div>
        )}
      </section>

      {user?.isAdmin && (
        <section className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-bold text-white">Swap Meet Admin</h2>
              <p className="text-sm text-neutral-400 mt-1">{adminRows.length} users have booked stalls.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => exportRows('swap-meet-unpaid.csv', unpaidRows)}
                className="bg-neutral-700 hover:bg-neutral-600 text-neutral-100 text-sm px-3 py-2 rounded-lg"
              >
                Export Unpaid
              </button>
              <button
                onClick={() => exportRows('swap-meet-uninvoiced.csv', uninvoicedRows)}
                className="bg-neutral-700 hover:bg-neutral-600 text-neutral-100 text-sm px-3 py-2 rounded-lg"
              >
                Export Uninvoiced
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-400 border-b border-neutral-700">
                  <th className="py-2 pr-4 font-medium">User</th>
                  <th className="py-2 pr-4 font-medium">Email</th>
                  <th className="py-2 pr-4 font-medium">Stalls</th>
                  <th className="py-2 pr-4 font-medium">Owes</th>
                  <th className="py-2 pr-4 font-medium">Paid</th>
                  <th className="py-2 pr-4 font-medium">Invoiced</th>
                  <th className="py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-neutral-500">No swap meet bookings yet.</td>
                  </tr>
                )}
                {adminRows.map(({ booking, email, name }) => (
                  <tr key={booking.id} className="border-b border-neutral-800 text-neutral-200">
                    <td className="py-3 pr-4 font-medium text-white">{name}</td>
                    <td className="py-3 pr-4 text-neutral-400">{email || 'Unknown'}</td>
                    <td className="py-3 pr-4">{booking.stallCount}</td>
                    <td className="py-3 pr-4">{formatCurrency(booking.amountOwed)}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-1 rounded-full text-xs border ${booking.paid ? 'bg-green-900/40 text-green-300 border-green-800' : 'bg-red-900/30 text-red-300 border-red-900/60'}`}>
                        {booking.paid ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-1 rounded-full text-xs border ${booking.invoiced ? 'bg-green-900/40 text-green-300 border-green-800' : 'bg-amber-900/30 text-amber-300 border-amber-800/60'}`}>
                        {booking.invoiced ? 'Sent' : 'Not sent'}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleAdminAction(booking.id, onMarkPaid)}
                          disabled={booking.paid || adminBusyId === booking.id}
                          className="bg-green-800 hover:bg-green-700 disabled:bg-neutral-700 disabled:text-neutral-500 text-green-100 text-xs px-3 py-1.5 rounded"
                        >
                          Mark Paid
                        </button>
                        <button
                          onClick={() => handleAdminAction(booking.id, onMarkInvoiced)}
                          disabled={booking.invoiced || adminBusyId === booking.id}
                          className="bg-amber-700 hover:bg-amber-600 disabled:bg-neutral-700 disabled:text-neutral-500 text-white text-xs px-3 py-1.5 rounded"
                        >
                          Mark Invoiced
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};
