import {setGlobalOptions} from "firebase-functions";
import {onDocumentCreated, onDocumentUpdated} from "firebase-functions/v2/firestore";
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
 * Format a date string (YYYY-MM-DD) into a human-readable format.
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
 */
async function getUserEmail(memberId: string): Promise<string | null> {
  const userDoc = await db.collection("users").doc(memberId).get();
  if (userDoc.exists) {
    return userDoc.data()?.email || null;
  }
  return null;
}

/**
 * Look up a table name from the tables collection.
 */
async function getTableName(tableId: string): Promise<string> {
  const tableDoc = await db.collection("tables").doc(tableId).get();
  if (tableDoc.exists) {
    return tableDoc.data()?.name || tableId;
  }
  return tableId;
}

/**
 * Look up a terrain box name from the terrainBoxes collection.
 */
async function getTerrainName(terrainBoxId: string): Promise<string> {
  const terrainDoc = await db.collection("terrainBoxes").doc(terrainBoxId).get();
  if (terrainDoc.exists) {
    return terrainDoc.data()?.name || terrainBoxId;
  }
  return terrainBoxId;
}

/**
 * Build the HTML email body for a booking confirmation.
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
    <p>To change or cancel, visit the Axes &amp; Ales booking site.</p>
  `;
}

/**
 * Build the HTML email body for a booking modification.
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
    <p>To make further changes, visit the Axes &amp; Ales booking site.</p>
  `;
}

/**
 * Build the HTML email body for a booking cancellation.
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
    <p>You can make a new booking any time on the Axes &amp; Ales booking site.</p>
  `;
}

/**
 * Queue an email by writing to the 'mail' collection
 * (picked up by the Trigger Email from Firestore extension).
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
    const booking = event.data?.data() as BookingData | undefined;
    if (!booking) return;

    const email = await getUserEmail(booking.memberId);
    if (!email) {
      logger.warn(`No email found for member ${booking.memberId}`);
      return;
    }

    const tableName = await getTableName(booking.tableId);
    const terrainName = booking.terrainBoxId ?
      await getTerrainName(booking.terrainBoxId) : null;

    const html = buildConfirmationEmail(booking, tableName, terrainName);
    await queueEmail(email, `Booking Confirmed — ${formatDate(booking.date)}`, html);

    logger.info(`Confirmation email queued for ${email} (booking ${event.params.bookingId})`);
  },
);

/**
 * Triggered when a booking is updated.
 * Sends either a modification or cancellation email depending on status change.
 */
export const onBookingUpdated = onDocumentUpdated(
  "bookings/{bookingId}",
  async (event) => {
    const before = event.data?.before.data() as BookingData | undefined;
    const after = event.data?.after.data() as BookingData | undefined;
    if (!before || !after) return;

    const email = await getUserEmail(after.memberId);
    if (!email) {
      logger.warn(`No email found for member ${after.memberId}`);
      return;
    }

    const tableName = await getTableName(after.tableId);

    // Booking was cancelled
    if (before.status === "active" && after.status === "cancelled") {
      const terrainName = after.terrainBoxId ?
        await getTerrainName(after.terrainBoxId) : null;
      const html = buildCancellationEmail(after, tableName, terrainName);
      await queueEmail(email, `Booking Cancelled — ${formatDate(after.date)}`, html);
      logger.info(`Cancellation email queued for ${email} (booking ${event.params.bookingId})`);
      return;
    }

    // Booking was modified (only if something meaningful changed)
    const changed =
      before.date !== after.date ||
      before.tableId !== after.tableId ||
      before.terrainBoxId !== after.terrainBoxId ||
      before.gameSystem !== after.gameSystem ||
      before.playerCount !== after.playerCount;

    if (changed && after.status === "active") {
      const terrainName = after.terrainBoxId ?
        await getTerrainName(after.terrainBoxId) : null;
      const html = buildModificationEmail(after, tableName, terrainName);
      await queueEmail(email, `Booking Updated — ${formatDate(after.date)}`, html);
      logger.info(`Modification email queued for ${email} (booking ${event.params.bookingId})`);
    }
  },
);
