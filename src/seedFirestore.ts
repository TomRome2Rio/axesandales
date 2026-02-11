/**
 * One-off script to seed Firestore with initial tables and terrain boxes.
 * 
 * Run with: npx tsx src/seedFirestore.ts <email> <password>
 * 
 * This will sign in as the given user, then write all tables and terrain boxes
 * from constants.ts into Firestore. Existing docs with the same IDs will be overwritten.
 */
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, getDocs } from 'firebase/firestore';
import { INITIAL_TABLES, INITIAL_TERRAIN_BOXES } from './constants';

const firebaseConfig = {
  apiKey: "AIzaSyAw2giJZYmLM8vG3BsD4EBFOiFhn2H3jVg",
  authDomain: "axes-and-ales-booking-site.firebaseapp.com",
  projectId: "axes-and-ales-booking-site",
  storageBucket: "axes-and-ales-booking-site.firebasestorage.app",
  messagingSenderId: "782018808364",
  appId: "1:782018808364:web:14dd94577fee6647531f89",
  measurementId: "G-TJ97F573Q5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function seed() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('Usage: npx tsx src/seedFirestore.ts <email> <password>');
    process.exit(1);
  }

  console.log(`Signing in as ${email}...`);
  await signInWithEmailAndPassword(auth, email, password);
  console.log('Authenticated successfully.\n');

  console.log('Seeding Firestore...\n');

  // Seed tables
  console.log(`Writing ${INITIAL_TABLES.length} tables...`);
  for (const table of INITIAL_TABLES) {
    await setDoc(doc(db, 'tables', table.id), table);
    console.log(`  ✓ ${table.id} - ${table.name} (${table.size})`);
  }

  // Seed terrain boxes
  console.log(`\nWriting ${INITIAL_TERRAIN_BOXES.length} terrain boxes...`);
  for (const box of INITIAL_TERRAIN_BOXES) {
    await setDoc(doc(db, 'terrainBoxes', box.id), box);
    console.log(`  ✓ ${box.id} - ${box.name} (${box.category})`);
  }

  // Create schedule config doc if missing
  const configSnap = await getDocs(collection(db, 'config'));
  if (configSnap.empty) {
    console.log('\nCreating schedule config...');
    await setDoc(doc(db, 'config', 'schedule'), {
      cancelledDates: [],
      specialEventDates: []
    });
    console.log('  ✓ config/schedule created');
  } else {
    console.log('\nSchedule config already exists, skipping.');
  }

  console.log('\n✅ Firestore seeded successfully!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
