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
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  console.log(
    "Looking up unpaid users created before " +
    `${twoWeeksAgo.toISOString()}...`,
  );

  const snapshot = await db
    .collection("users")
    .where("isMember", "==", false)
    .where("createdAt", "<=", twoWeeksAgo)
    .get();

  if (snapshot.empty) {
    console.log("No matching unpaid members found.");
    return;
  }

  console.log(
    `Found ${snapshot.size} unpaid member(s).`,
  );

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
      "Axes & Ales — Membership Reminder";
    const html = buildUnpaidReminderEmail(name);
    await queueEmail(email, subject, html);

    // Track when this reminder was last sent
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

sendUnpaidReminders()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error sending reminders:", err);
    process.exit(1);
  });
