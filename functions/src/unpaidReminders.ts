/**
 * Send payment reminder emails to unpaid members.
 *
 * Finds all users with isMember === false, sends them
 * a reminder that payment is needed to book tables,
 * and records when the reminder was last sent.
 *
 * Usage:
 *   Set GOOGLE_APPLICATION_CREDENTIALS or pass a service
 *   account JSON via FIREBASE_SERVICE_ACCOUNT env var,
 *   plus FIREBASE_PROJECT_ID.
 *
 *   npx tsx functions/src/unpaidReminders.ts
 */
import * as admin from "firebase-admin";
import {buildUnpaidReminderEmail} from "./emailTemplates";

const serviceAccount =
  process.env.FIREBASE_SERVICE_ACCOUNT;
const projectId = process.env.FIREBASE_PROJECT_ID;

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(serviceAccount),
    ),
    projectId,
  });
} else {
  admin.initializeApp({projectId});
}

const db = admin.firestore();

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
    message: {subject, html},
  });
}

/**
 * Send payment reminders to all unpaid members.
 * @return {Promise<void>} Resolves when done.
 */
async function sendUnpaidReminders(): Promise<void> {
  // TEST: hardcoded send to me only
  const html = buildUnpaidReminderEmail("Tom");
  const subject = "Axes & Ales — Membership Reminder";
  await queueEmail("tomhclare@gmail.com", subject, html);
  console.log("✓ Test reminder sent to tomhclare@gmail.com");
}

sendUnpaidReminders()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error sending reminders:", err);
    process.exit(1);
  });
