/**
 * One-off script to seed Firestore with initial tables and terrain boxes.
 * 
 * Run with: npx tsx src/scripts/seedFirestore.ts <email> <password>
 * 
 * This will sign in as the given user, then write all tables and terrain boxes
 * from constants.ts into Firestore. Existing docs with the same IDs will be overwritten.
 */
import { config } from 'dotenv';
// Load .env.local first (local dev), then fall back to .env
config({ path: '.env.local' });
config({ path: '.env' });

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, getDocs } from 'firebase/firestore';
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

async function seed() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('Usage: npx tsx src/scripts/seedFirestore.ts <email> <password>');
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

  // Seed game systems
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

  console.log(`\nWriting ${INITIAL_GAME_SYSTEMS.length} game systems...`);
  for (const name of INITIAL_GAME_SYSTEMS) {
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    await setDoc(doc(db, 'gameSystems', id), { name });
    console.log(`  ✓ ${id} - ${name}`);
  }

  console.log('\n✅ Firestore seeded successfully!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
