/**
 * Shared email templates for Axes & Ales functions.
 */

// =====================================================
// Shared types
// =====================================================

export interface BookingData {
  id: string;
  date: string;
  tableId: string;
  terrainBoxId?: string | null;
  memberName: string;
  memberId: string;
  gameSystem: string;
  playerCount: number;
  timestamp: number;
  status: "active" | "cancelled";
  cancelledAt?: number;
  cancelledBy?: string;
}

// =====================================================
// Formatting helpers
// =====================================================

/**
 * Format a date with weekday (for bookings).
 * @param {string} dateStr - YYYY-MM-DD date string.
 * @return {string} Formatted date.
 */
export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Format a date without weekday (for membership).
 * @param {string} dateStr - YYYY-MM-DD date string.
 * @return {string} Formatted date.
 */
export function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// =====================================================
// Booking emails
// =====================================================

/**
 * Build HTML email for a booking confirmation.
 */
export function buildConfirmationEmail(
  booking: BookingData,
  tableName: string,
  terrainName: string | null,
): string {
  return `
    <p>Hi ${booking.memberName},</p>
    <p>Your booking is confirmed:</p>
    <p>
      <strong>${formatDate(booking.date)}</strong><br>
      Table: ${tableName}<br>
      Terrain: ${terrainName || "None"}<br>
      Game: ${booking.gameSystem}<br>
      Players: ${booking.playerCount}
    </p>
    <p>To change or cancel, visit
    <a href="https://www.axesandales.club/booking">
    Axes &amp; Ales</a>.</p>
  `;
}

/**
 * Build HTML email for a booking modification.
 */
export function buildModificationEmail(
  booking: BookingData,
  tableName: string,
  terrainName: string | null,
): string {
  return `
    <p>Hi ${booking.memberName},</p>
    <p>Your booking has been updated:</p>
    <p>
      <strong>${formatDate(booking.date)}</strong><br>
      Table: ${tableName}<br>
      Terrain: ${terrainName || "None"}<br>
      Game: ${booking.gameSystem}<br>
      Players: ${booking.playerCount}
    </p>
    <p>To make further changes, visit
    <a href="https://www.axesandales.club/booking">
    Axes &amp; Ales</a>.</p>
  `;
}

/**
 * Build HTML email for a booking cancellation.
 */
export function buildCancellationEmail(
  booking: BookingData,
  tableName: string,
  terrainName: string | null,
): string {
  return `
    <p>Hi ${booking.memberName},</p>
    <p>Your booking has been cancelled:</p>
    <p>
      ${formatDate(booking.date)}<br>
      Table: ${tableName}<br>
      Terrain: ${terrainName || "None"}<br>
      Game: ${booking.gameSystem}
    </p>
    <p>You can make a new booking any time on
    <a href="https://www.axesandales.club/booking">
    Axes &amp; Ales</a>.</p>
  `;
}

// =====================================================
// Membership emails
// =====================================================

/**
 * Build HTML email for membership activation.
 */
export function buildMembershipActivatedEmail(
  name: string,
  expiryDate: string,
): string {
  return `
    <p>Hi ${name},</p>
    <p>Welcome to <strong>Axes &amp; Ales</strong>! 🎉</p>
    <p>Your membership has been activated and is valid
    until <strong>${formatShortDate(expiryDate)}</strong>.</p>
    <p>As a member, you can now
    <a href="https://www.axesandales.club/booking">
    book tables in advance</a> for club nights.
    We look forward to seeing you at the table!</p>
    <p>Thank you for supporting the club.</p>
    <p>— The Axes &amp; Ales Committee</p>
  `;
}

/**
 * Build HTML email for membership renewal.
 */
export function buildMembershipRenewedEmail(
  name: string,
  expiryDate: string,
): string {
  return `
    <p>Hi ${name},</p>
    <p>Thanks for renewing your
    <strong>Axes &amp; Ales</strong> membership! 🙌</p>
    <p>Your membership has been extended and is now valid
    until <strong>${formatShortDate(expiryDate)}</strong>.</p>
    <p>You can continue to
    <a href="https://www.axesandales.club/booking">
    book tables</a> for upcoming club nights.</p>
    <p>Thank you for your continued support!</p>
    <p>— The Axes &amp; Ales Committee</p>
  `;
}

// =====================================================
// Expiry reminder email (used by membershipReminders)
// =====================================================

/**
 * Build HTML email for an expiry reminder.
 */
export function buildExpiryReminderEmail(
  name: string,
  expiryDate: string,
  daysUntil: number,
): string {
  const urgency = daysUntil <= 7 ?
    "expires in just one week" :
    "expires in one month";
  return `
    <p>Hi ${name},</p>
    <p>Just a friendly heads-up — your
    <strong>Axes &amp; Ales</strong> membership
    ${urgency}, on
    <strong>${formatShortDate(expiryDate)}</strong>.</p>
    <p>To keep booking tables for club nights,
    head to the
    <a href="https://www.axesandales.club/membership">
    Membership &amp; Payment</a> page to renew.</p>
    <p>Once you've paid, the committee will update
    your membership — no need to do anything
    else.</p>
    <p>See you at the table!</p>
    <p>— The Axes &amp; Ales Committee</p>
  `;
}

// =====================================================
// Unpaid member reminder
// =====================================================

/**
 * Build HTML email for an unpaid member reminder.
 */
export function buildUnpaidReminderEmail(
  name: string,
): string {
  return `
    <p>Hi ${name},</p>
    <p>Thank you for creating an Axes & Ales account.</p>
    <p>If you wanted to become a member to book tables 
    and support the club, please head to the
    <a href="https://www.axesandales.club/membership">
    Membership &amp; Payment</a> page.</p>
    <p>If you've already paid, please
    <a href="mailto:axesandalescommittee@gmail.com">
    contact the committee</a> so we can match your
    payment to your account.</p>
    <p>See you at the table!</p>
    <p>— The Axes &amp; Ales Committee</p>
  `;
}
