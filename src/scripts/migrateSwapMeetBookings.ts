/**
 * Links legacy swap meet bookings to a swapMeetState document.
 *
 * Run with:
 * npx tsx src/scripts/migrateSwapMeetBookings.ts <email> <password> <meet-id> <YYYY-MM-DD> <stall-count>
 *
 * Existing bookings that already have a swapMeetId are left unchanged.
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

import { deleteApp, initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  collection,
  deleteField,
  doc,
  getDocs,
  getFirestore,
  setDoc,
  terminate,
  writeBatch,
} from 'firebase/firestore';

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
async function migrate(): Promise<void> {
  const [email, password, meetId, date, stallCountInput] = process.argv.slice(2);
  const stallCount = Number(stallCountInput);
  if (!email || !password || !meetId || !/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !Number.isInteger(stallCount) || stallCount < 1) {
    console.error('Usage: npx tsx src/scripts/migrateSwapMeetBookings.ts <email> <password> <meet-id> <YYYY-MM-DD> <stall-count>');
    process.exit(1);
  }

  await signInWithEmailAndPassword(auth, email, password);
  const bookingsSnapshot = await getDocs(collection(db, 'swapMeetBookings'));
  const legacyBookings = bookingsSnapshot.docs.filter(booking => !booking.data().swapMeetId);
  const targetMeetBookings = bookingsSnapshot.docs.filter(booking => (
    !booking.data().swapMeetId || booking.data().swapMeetId === meetId
  ));
  const activeStallCount = targetMeetBookings
    .filter(booking => booking.data().status !== 'cancelled')
    .reduce((total, booking) => total + Number(booking.data().stallCount ?? 0), 0);

  if (activeStallCount > stallCount) {
    throw new Error(`Legacy bookings use ${activeStallCount} half-tables, exceeding the ${stallCount} available.`);
  }

  const now = Date.now();
  await setDoc(doc(db, 'swapMeetState', meetId), {
    date,
    stallCount,
    tableCount: deleteField(),
    bookedStallCount: activeStallCount,
    updatedAt: now,
    createdAt: now,
  }, { merge: true });

  for (let index = 0; index < legacyBookings.length; index += 450) {
    const batch = writeBatch(db);
    legacyBookings.slice(index, index + 450).forEach(booking => {
      batch.update(booking.ref, { swapMeetId: meetId });
    });
    await batch.commit();
  }

  console.log(`Linked ${legacyBookings.length} legacy booking(s) to ${meetId}.`);
  console.log(`Swap meet date: ${date}; half-tables: ${stallCount}; active booked: ${activeStallCount}.`);
}

const shutdown = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Could not sign out:', error);
  }
  try {
    await terminate(db);
  } catch (error) {
    console.error('Could not terminate Firestore:', error);
  }
  try {
    await deleteApp(app);
  } catch (error) {
    console.error('Could not delete Firebase app:', error);
  }
};

migrate()
  .then(async () => {
    await shutdown();
    process.exit(0);
  })
  .catch(async error => {
    console.error(error);
    await shutdown();
    process.exit(1);
  });
