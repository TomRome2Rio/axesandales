/**
 * Send payment reminder to users who signed up ~2 weeks
 * ago and still haven't paid for membership.
 *
 * Runs as a standalone script via GitHub Actions cron
 * (daily). Uses Firebase Admin SDK to bypass security
 * rules and write to the `mail` collection.
 *
 * Usage:
 *   Set GOOGLE_APPLICATION_CREDENTIALS or pass a service
 *   account JSON via FIREBASE_SERVICE_ACCOUNT env var,
 *   plus FIREBASE_PROJECT_ID.
 *
 *   npx tsx functions/src/newUserReminders.ts
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
 * Send reminders to users created 14–15 days ago who
 * are still not members and haven't been reminded yet.
 * @return {Promise<void>} Resolves when done.
 */
async function sendNewUserReminders(): Promise<void> {
  const now = new Date();
  const windowStart = new Date(now);
  windowStart.setDate(windowStart.getDate() - 15);
  const windowEnd = new Date(now);
  windowEnd.setDate(windowEnd.getDate() - 14);

  console.log(
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
    console.log("No matching users found.");
    return;
  }

  let sent = 0;
  let skipped = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const email = data.email as string | undefined;
    const name = data.name as string | undefined;

    if (data.unpaidReminderLastSent) {
      console.log(
        `  Skipping user ${doc.id} — already reminded.`,
      );
      skipped++;
      continue;
    }

    if (!email || !name) {
      console.warn(
        `  Skipping user ${doc.id} — missing email or name.`,
      );
      skipped++;
      continue;
    }

    const subject =
      "Axes & Ales — Membership Payment Reminder";
    const html = buildUnpaidReminderEmail(name);
    await queueEmail(email, subject, html);

    await db.collection("users").doc(doc.id).update({
      unpaidReminderLastSent:
        admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`  ✓ Reminder sent to ${email}`);
    sent++;
  }

  console.log(
    `\nDone. ${sent} reminder(s) sent, ` +
    `${skipped} skipped.`,
  );
}

sendNewUserReminders()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error sending reminders:", err);
    process.exit(1);
  });
