import * as admin from "firebase-admin";

const projectId = process.env.FIREBASE_PROJECT_ID;
admin.initializeApp({projectId});
const db = admin.firestore();

/**
 * Check createdAt field status across all users.
 * @return {Promise<void>} Resolves when done.
 */
async function main() {
  const snap = await db.collection("users").get();
  let earliest: Date | null = null;
  let withCount = 0;
  let withoutCount = 0;

  for (const doc of snap.docs) {
    const ca = doc.data().createdAt;
    if (ca) {
      withCount++;
      const d = ca.toDate ? ca.toDate() : new Date(ca);
      if (!earliest || d < earliest) earliest = d;
    } else {
      withoutCount++;
    }
  }

  console.log("Users with createdAt:", withCount);
  console.log("Users without createdAt:", withoutCount);
  console.log("Earliest createdAt:", earliest?.toISOString() ?? "none");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
