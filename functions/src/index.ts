import {setGlobalOptions} from "firebase-functions";
import {
  onDocumentCreated,
  onDocumentUpdated,
} from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import {getFirestore} from "firebase-admin/firestore";
import {initializeApp} from "firebase-admin/app";

initializeApp();
const db = getFirestore();

setGlobalOptions({maxInstances: 10});

// =====================================================
// BOOKING CONFIRMATION EMAILS
// =====================================================

interface BookingData {
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

/**
 * Format a date string into a human-readable format.
 * @param {string} dateStr - YYYY-MM-DD date string.
 * @return {string} Formatted date.
 */
function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Look up a user's email from the users collection.
 * @param {string} memberId - Firebase user ID.
 * @return {Promise<string | null>} The user's email.
 */
async function getUserEmail(
  memberId: string,
): Promise<string | null> {
  const userDoc = await db
    .collection("users").doc(memberId).get();
  if (userDoc.exists) {
    return userDoc.data()?.email || null;
  }
  return null;
}

/**
 * Look up a table name from the tables collection.
 * @param {string} tableId - Table document ID.
 * @return {Promise<string>} The table name.
 */
async function getTableName(
  tableId: string,
): Promise<string> {
  const tableDoc = await db
    .collection("tables").doc(tableId).get();
  if (tableDoc.exists) {
    return tableDoc.data()?.name || tableId;
  }
  return tableId;
}

/**
 * Look up a terrain box name.
 * @param {string} terrainBoxId - Terrain box document ID.
 * @return {Promise<string>} The terrain box name.
 */
async function getTerrainName(
  terrainBoxId: string,
): Promise<string> {
  const terrainDoc = await db
    .collection("terrainBoxes").doc(terrainBoxId).get();
  if (terrainDoc.exists) {
    return terrainDoc.data()?.name || terrainBoxId;
  }
  return terrainBoxId;
}

/**
 * Build HTML email for a booking confirmation.
 * @param {BookingData} booking - The booking data.
 * @param {string} tableName - Display name of the table.
 * @param {string | null} terrainName - Terrain box name.
 * @return {string} HTML email body.
 */
function buildConfirmationEmail(
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
 * @param {BookingData} booking - The booking data.
 * @param {string} tableName - Display name of the table.
 * @param {string | null} terrainName - Terrain box name.
 * @return {string} HTML email body.
 */
function buildModificationEmail(
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
 * @param {BookingData} booking - The booking data.
 * @param {string} tableName - Display name of the table.
 * @param {string | null} terrainName - Terrain box name.
 * @return {string} HTML email body.
 */
function buildCancellationEmail(
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

/**
 * Queue an email via the mail collection.
 * @param {string} to - Recipient email address.
 * @param {string} subject - Email subject line.
 * @param {string} html - HTML email body.
 * @return {Promise<void>} Resolves when queued.
 */
async function queueEmail(
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  await db.collection("mail").add({
    to: [to],
    message: {
      subject,
      html,
    },
  });
}

/**
 * Triggered when a new booking is created.
 * Sends a confirmation email to the member.
 */
export const onBookingCreated = onDocumentCreated(
  "bookings/{bookingId}",
  async (event) => {
    const data = event.data?.data();
    const booking = data as BookingData | undefined;
    if (!booking) return;

    const email = await getUserEmail(booking.memberId);
    if (!email) {
      logger.warn(
        `No email for member ${booking.memberId}`,
      );
      return;
    }

    const tableName = await getTableName(booking.tableId);
    const terrainName = booking.terrainBoxId ?
      await getTerrainName(booking.terrainBoxId) : null;

    const html = buildConfirmationEmail(
      booking, tableName, terrainName,
    );
    const subject =
      `Booking Confirmed - ${formatDate(booking.date)}`;
    await queueEmail(email, subject, html);

    const id = event.params.bookingId;
    logger.info(
      `Confirmation email queued for ${email} (${id})`,
    );
  },
);

/**
 * Triggered when a booking is updated.
 * Sends a modification or cancellation email.
 */
export const onBookingUpdated = onDocumentUpdated(
  "bookings/{bookingId}",
  async (event) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();
    const before = beforeData as BookingData | undefined;
    const after = afterData as BookingData | undefined;
    if (!before || !after) return;

    const email = await getUserEmail(after.memberId);
    if (!email) {
      logger.warn(
        `No email for member ${after.memberId}`,
      );
      return;
    }

    const tableName = await getTableName(after.tableId);
    const id = event.params.bookingId;

    // Booking was cancelled
    if (
      before.status === "active" &&
      after.status === "cancelled"
    ) {
      const terrainName = after.terrainBoxId ?
        await getTerrainName(after.terrainBoxId) : null;
      const html = buildCancellationEmail(
        after, tableName, terrainName,
      );
      const subject =
        `Booking Cancelled - ${formatDate(after.date)}`;
      await queueEmail(email, subject, html);
      logger.info(
        `Cancellation email queued for ${email} (${id})`,
      );
      return;
    }

    // Booking was modified (only if something changed)
    const changed =
      before.date !== after.date ||
      before.tableId !== after.tableId ||
      before.terrainBoxId !== after.terrainBoxId ||
      before.gameSystem !== after.gameSystem ||
      before.playerCount !== after.playerCount;

    if (changed && after.status === "active") {
      const terrainName = after.terrainBoxId ?
        await getTerrainName(after.terrainBoxId) : null;
      const html = buildModificationEmail(
        after, tableName, terrainName,
      );
      const subject =
        `Booking Updated - ${formatDate(after.date)}`;
      await queueEmail(email, subject, html);
      logger.info(
        `Modification email queued for ${email} (${id})`,
      );
    }
  },
);

// =====================================================
// MEMBERSHIP CONFIRMATION EMAILS
// =====================================================

interface MembershipAuditData {
  id: string;
  userId: string;
  action: "activated" | "renewed" | "cancelled";
  performedBy: string;
  performedByName: string;
  timestamp: number;
}

/**
 * Format a date string (YYYY-MM-DD) for display.
 * @param {string} dateStr - ISO date string.
 * @return {string} Formatted date.
 */
function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Build HTML email for membership activation.
 * @param {string} name - Member's display name.
 * @param {string} expiryDate - Membership expiry date.
 * @return {string} HTML email body.
 */
function buildMembershipActivatedEmail(
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
 * @param {string} name - Member's display name.
 * @param {string} expiryDate - New membership expiry date.
 * @return {string} HTML email body.
 */
function buildMembershipRenewedEmail(
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

/**
 * Triggered when a membership audit entry is created.
 * Sends a confirmation email for activations and renewals.
 */
export const onMembershipAuditCreated = onDocumentCreated(
  "membershipAudit/{entryId}",
  async (event) => {
    const data = event.data?.data();
    const entry = data as MembershipAuditData | undefined;
    if (!entry) return;

    // Only send emails for activations and renewals
    if (entry.action !== "activated" &&
        entry.action !== "renewed") {
      return;
    }

    // Look up the user's profile
    const userDoc = await db
      .collection("users").doc(entry.userId).get();
    if (!userDoc.exists) {
      logger.warn(
        `No user profile for ${entry.userId}`,
      );
      return;
    }

    const userData = userDoc.data();
    const email = userData?.email as string | undefined;
    const name = userData?.name as string | undefined;
    const expiryDate =
      userData?.membershipExpiryDate as string | undefined;

    if (!email || !name) {
      logger.warn(
        `Missing email/name for user ${entry.userId}`,
      );
      return;
    }

    if (!expiryDate) {
      logger.warn(
        `No expiry date for user ${entry.userId}, ` +
        "skipping membership email",
      );
      return;
    }

    const html = entry.action === "activated" ?
      buildMembershipActivatedEmail(name, expiryDate) :
      buildMembershipRenewedEmail(name, expiryDate);

    const subject = entry.action === "activated" ?
      "Welcome to Axes & Ales — Membership Activated!" :
      "Axes & Ales — Membership Renewed!";

    await queueEmail(email, subject, html);

    const id = event.params.entryId;
    logger.info(
      `Membership ${entry.action} email queued ` +
      `for ${email} (${id})`,
    );
  },
);
