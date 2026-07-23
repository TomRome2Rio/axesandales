/**
 * Manually initialise missing default Firestore inventory.
 * 
 * Run with: npm run init:firestore -- <email> <password>
 * 
 * This will sign in as the given user and create only missing default documents.
 * Existing documents are never overwritten.
 */
import { config } from 'dotenv';
// Load .env.local first (local dev), then fall back to .env
config({ path: '.env.local' });
config({ path: '.env' });

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { INITIAL_TABLES, INITIAL_TERRAIN_BOXES } from '../constants';

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

async function initialiseFirestore() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('Usage: npm run init:firestore -- <email> <password>');
    process.exit(1);
  }

  console.log(`Signing in as ${email}...`);
  await signInWithEmailAndPassword(auth, email, password);
  console.log('Authenticated successfully.\n');

  console.log('Initialising missing Firestore documents...\n');

  // Create missing tables
  console.log(`Checking ${INITIAL_TABLES.length} tables...`);
  for (const table of INITIAL_TABLES) {
    const tableRef = doc(db, 'tables', table.id);
    if ((await getDoc(tableRef)).exists()) {
      console.log(`  - ${table.id} already exists, skipping`);
      continue;
    }
    await setDoc(tableRef, table);
    console.log(`  ✓ ${table.id} - ${table.name} (${table.size})`);
  }

  // Create missing terrain boxes
  console.log(`\nChecking ${INITIAL_TERRAIN_BOXES.length} terrain boxes...`);
  for (const box of INITIAL_TERRAIN_BOXES) {
    const boxRef = doc(db, 'terrainBoxes', box.id);
    if ((await getDoc(boxRef)).exists()) {
      console.log(`  - ${box.id} already exists, skipping`);
      continue;
    }
    await setDoc(boxRef, box);
    console.log(`  ✓ ${box.id} - ${box.name} (${box.category})`);
  }

  // Create schedule config doc if missing
  const scheduleRef = doc(db, 'config', 'schedule');
  if (!(await getDoc(scheduleRef)).exists()) {
    console.log('\nCreating schedule config...');
    await setDoc(scheduleRef, {
      cancelledDates: [],
      specialEventDates: []
    });
    console.log('  ✓ config/schedule created');
  } else {
    console.log('\nSchedule config already exists, skipping.');
  }

  // Create missing game systems
  const INITIAL_GAME_SYSTEMS = [
    'Warhammer 40,000',
    'Age of Sigmar',
    'Blood Bowl',
    'The Old World',
    'Heresy',
    'Kill Team',
    'Necromunda',
    'Middle Earth',
    'Warcry',
    'Malifaux',
    'BattleTech',
    'Infinity',
    'Zeo Genesis',
    'A Song of Ice and Fire',
    'OPR Sci Fi',
    'OPR Fantasy',
    'Untitled Pirate Game',
    'Frostgrave',
    'Stargrave',
    'Silver Bayonet',
    'Bolt Action',
    'Lion Rampant',
    'Pillage',
  ];

  console.log(`\nChecking ${INITIAL_GAME_SYSTEMS.length} game systems...`);
  for (const name of INITIAL_GAME_SYSTEMS) {
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const gameSystemRef = doc(db, 'gameSystems', id);
    if ((await getDoc(gameSystemRef)).exists()) {
      console.log(`  - ${id} already exists, skipping`);
      continue;
    }
    await setDoc(gameSystemRef, { name });
    console.log(`  ✓ ${id} - ${name}`);
  }

  console.log('\n✅ Firestore seeded successfully!');
  process.exit(0);
}

initialiseFirestore().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
