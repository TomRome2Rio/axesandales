/**
 * Migration: backfill createdAt from Firebase Auth metadata.
 * For each user doc missing createdAt, looks up the Auth
 * account's creationTime and writes it to Firestore.
 *
 * Usage:
 *   FIREBASE_PROJECT_ID=axes-and-ales-booking-site
 *   npx tsx functions/src/migrateCreatedAt.ts
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
 * Backfill createdAt from Firebase Auth metadata.
 * @return {Promise<void>} Resolves when done.
 */
async function migrate() {
  const snap = await db.collection("users").get();
  console.log(`Found ${snap.size} user(s).`);

  // Build a map of uid → creationTime from Auth (batch)
  const authMap = new Map<string, string>();
  let nextPageToken: string | undefined;
  do {
    const listResult = await admin.auth().listUsers(
      1000, nextPageToken,
    );
    for (const user of listResult.users) {
      if (user.metadata.creationTime) {
        authMap.set(user.uid, user.metadata.creationTime);
      }
    }
    nextPageToken = listResult.pageToken;
  } while (nextPageToken);

  console.log(
    `Fetched ${authMap.size} auth record(s).`,
  );

  let updated = 0;
  let skipped = 0;
  const failed = 0;

  const batch = db.batch();
  let batchCount = 0;

  for (const doc of snap.docs) {
    if (doc.data().createdAt) {
      skipped++;
      continue;
    }

    const creationTime = authMap.get(doc.id);
    if (!creationTime) {
      console.warn(
        `  Skipping ${doc.id} — no auth record found.`,
      );
      skipped++;
      continue;
    }

    batch.update(
      db.collection("users").doc(doc.id),
      {createdAt: new Date(creationTime)},
    );
    console.log(`  ✓ ${doc.id} → ${creationTime}`);
    updated++;
    batchCount++;

    // Firestore batches max 500 writes
    if (batchCount === 500) {
      await batch.commit();
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  console.log(
    `\nDone. ${updated} updated, ` +
    `${skipped} skipped, ${failed} failed.`,
  );
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration error:", err);
    process.exit(1);
  });
