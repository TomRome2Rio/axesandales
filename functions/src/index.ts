import {setGlobalOptions} from "firebase-functions";
import {
  onDocumentCreated,
  onDocumentUpdated,
} from "firebase-functions/v2/firestore";
import {onSchedule} from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import {initializeApp} from "firebase-admin/app";
import {
  BookingData,
  buildConfirmationEmail,
  buildModificationEmail,
  buildCancellationEmail,
  buildMembershipActivatedEmail,
  buildMembershipRenewedEmail,
  buildUnpaidReminderEmail,
  formatDate,
} from "./emailTemplates";

initializeApp();
const db = getFirestore();

setGlobalOptions({maxInstances: 10});

// =====================================================
// BOOKING CONFIRMATION EMAILS
// =====================================================

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

// =====================================================
// SCHEDULED: 2-WEEK UNPAID MEMBER REMINDERS
// =====================================================

/**
 * Runs daily. Finds users who created their account
 * ~14 days ago and are still not members, sends them
 * a payment reminder, and records the timestamp.
 */
export const sendNewUserUnpaidReminders = onSchedule(
  "every day 10:00",
  async () => {
    const now = new Date();
    // Window: created 14–15 days ago (catches once daily)
    const windowStart = new Date(now);
    windowStart.setDate(windowStart.getDate() - 15);
    const windowEnd = new Date(now);
    windowEnd.setDate(windowEnd.getDate() - 14);

    logger.info(
      "Checking for unpaid users created between " +
      `${windowStart.toISOString()} and ` +
      `${windowEnd.toISOString()}...`,
    );

    const snapshot = await db
      .collection("users")
      .where("isMember", "==", false)
      .where("createdAt", ">=", windowStart)
      .where("createdAt", "<=", windowEnd)
      .get();

    if (snapshot.empty) {
      logger.info("No matching users found.");
      return;
    }

    let sent = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const email = data.email as string | undefined;
      const name = data.name as string | undefined;

      if (data.unpaidReminderLastSent) {
        logger.info(
          `Skipping user ${doc.id} — already reminded`,
        );
        continue;
      }

      if (!email || !name) {
        logger.warn(
          `Skipping user ${doc.id} — missing email/name`,
        );
        continue;
      }

      const subject =
        "Axes & Ales \u2014 Membership Payment Reminder";
      const html = buildUnpaidReminderEmail(name);
      await queueEmail(email, subject, html);

      await db.collection("users").doc(doc.id).update({
        unpaidReminderLastSent:
          FieldValue.serverTimestamp(),
      });

      logger.info(
        `2-week unpaid reminder sent to ${email}`,
      );
      sent++;
    }

    logger.info(
      `Done. ${sent} new-user reminder(s) sent.`,
    );
  },
);
