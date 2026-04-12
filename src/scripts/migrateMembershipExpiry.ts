/**
 * One-off migration: set membershipExpiryDate on all existing members.
 *
 * Rules:
 *  - Users who paid in 2025 → grandfathered to 2026-06-30 (end of financial year)
 *  - Users who paid in 2026+ → paidDate + 12 months
 *
 * Run with: npx tsx src/scripts/migrateMembershipExpiry.ts <email> <password>
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY!,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.VITE_FIREBASE_APP_ID!,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID!,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function computeExpiryDate(paidDate: string): string {
  const paid = new Date(paidDate + 'T00:00:00');
  const year = paid.getFullYear();

  if (year <= 2025) {
    // Grandfathered: expires end of current financial year
    return '2026-06-30';
  }

  // 2026+: 12 months from paid date
  const expiry = new Date(paid);
  expiry.setFullYear(expiry.getFullYear() + 1);
  return expiry.toISOString().split('T')[0];
}

async function migrate() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('Usage: npx tsx src/scripts/migrateMembershipExpiry.ts <email> <password>');
    process.exit(1);
  }

  console.log(`Signing in as ${email}...`);
  await signInWithEmailAndPassword(auth, email, password);
  console.log('Authenticated.\n');

  const usersSnap = await getDocs(collection(db, 'users'));
  let updated = 0;
  let skipped = 0;

  for (const userDoc of usersSnap.docs) {
    const data = userDoc.data();
    const paidDate = data.membershipPaidDate as string | undefined;

    if (!paidDate || !data.isMember) {
      skipped++;
      continue;
    }

    const expiryDate = computeExpiryDate(paidDate);
    const existing = data.membershipExpiryDate as string | undefined;

    if (existing === expiryDate) {
      console.log(`  ⏭ ${data.email} — already set to ${expiryDate}`);
      skipped++;
      continue;
    }

    console.log(`  ✓ ${data.email} — paid ${paidDate} → expires ${expiryDate}${existing ? ` (was ${existing})` : ''}`);
    await updateDoc(doc(db, 'users', userDoc.id), { membershipExpiryDate: expiryDate });
    updated++;
  }

  console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}`);
  process.exit(0);
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
