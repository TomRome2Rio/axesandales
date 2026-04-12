/**
 * Membership expiry reminder emails.
 *
 * Runs as a standalone script via GitHub Actions cron
 * (daily). Uses Firebase Admin SDK to bypass security
 * rules and write to the `mail` collection.
 *
 * Sends reminders at:
 *  - 30 days before expiry
 *  - 7 days before expiry
 *
 * Usage:
 *   Set GOOGLE_APPLICATION_CREDENTIALS or pass a service
 *   account JSON via FIREBASE_SERVICE_ACCOUNT env var,
 *   plus FIREBASE_PROJECT_ID.
 *
 *   npx tsx functions/src/membershipReminders.ts
 */
import * as admin from "firebase-admin";

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
 * Format a date string for display.
 * @param {string} dateStr - ISO date string.
 * @return {string} Formatted date.
 */
function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Get a YYYY-MM-DD date N days from today.
 * @param {number} days - Number of days ahead.
 * @return {string} ISO date string.
 */
function getDateInDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

/**
 * Build HTML email for an expiry reminder.
 * @param {string} name - Member's display name.
 * @param {string} expiryDate - Expiry date string.
 * @param {number} daysUntil - Days until expiry.
 * @return {string} HTML email body.
 */
function buildReminderEmail(
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
    <strong>${formatDate(expiryDate)}</strong>.</p>
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
 * Send membership expiry reminders.
 * @return {Promise<void>} Resolves when done.
 */
async function sendReminders(): Promise<void> {
  const targets = [
    {days: 30, label: "1-month"},
    {days: 7, label: "1-week"},
  ];

  let totalSent = 0;

  for (const {days, label} of targets) {
    const targetDate = getDateInDays(days);
    console.log(
      `Checking for memberships expiring on ` +
      `${targetDate} (${label} reminder)...`,
    );

    const snapshot = await db
      .collection("users")
      .where("isMember", "==", true)
      .where("membershipExpiryDate", "==", targetDate)
      .get();

    if (snapshot.empty) {
      console.log(
        `  No members expiring on ${targetDate}.`,
      );
      continue;
    }

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const email = data.email as string | undefined;
      const name = data.name as string | undefined;

      if (!email || !name) {
        console.warn(
          `  Skipping user ${doc.id} ` +
          "— missing email or name.",
        );
        continue;
      }

      const subject = days <= 7 ?
        "Axes & Ales — Membership Expires Next Week!" :
        "Axes & Ales — Membership Expires Next Month";

      const html = buildReminderEmail(
        name, targetDate, days,
      );
      await queueEmail(email, subject, html);
      console.log(
        `  ✓ ${label} reminder sent to ${email}`,
      );
      totalSent++;
    }
  }

  console.log(`\nDone. ${totalSent} reminder(s) sent.`);
}

sendReminders()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error sending reminders:", err);
    process.exit(1);
  });
