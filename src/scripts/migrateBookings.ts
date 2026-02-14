/**
 * One-off migration script to add status: 'active' to all existing bookings
 * that don't already have a status field.
 *
 * Run with: npx tsx src/scripts/migrateBookings.ts <email> <password>
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

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

async function migrate() {
  const [, , email, password] = process.argv;
  if (!email || !password) {
    console.error('Usage: npx tsx src/scripts/migrateBookings.ts <email> <password>');
    process.exit(1);
  }

  await signInWithEmailAndPassword(auth, email, password);
  console.log('Signed in.');

  const snapshot = await getDocs(collection(db, 'bookings'));
  let updated = 0;
  let skipped = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    if (!data.status) {
      await updateDoc(doc(db, 'bookings', docSnap.id), { status: 'active' });
      updated++;
      console.log(`  Updated: ${docSnap.id}`);
    } else {
      skipped++;
    }
  }

  console.log(`\nDone. ${updated} bookings updated, ${skipped} already had a status.`);
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
