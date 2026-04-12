/**
 * One-off script to compare members.tsv against Firestore users.
 * 
 * Run with: npx tsx src/scripts/compareMemberships.ts <email> <password>
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

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

async function compare() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('Usage: npx tsx src/scripts/compareMemberships.ts <email> <password>');
    process.exit(1);
  }

  console.log(`Signing in as ${email}...`);
  await signInWithEmailAndPassword(auth, email, password);
  console.log('Authenticated.\n');

  // Read TSV
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const tsvPath = resolve(__dirname, '../../members.tsv');
  const tsvContent = readFileSync(tsvPath, 'utf-8');
  const tsvLines = tsvContent.trim().split('\n').slice(1); // skip header
  const tsvEmails = new Set(
    tsvLines.map(line => line.split('\t')[0].trim().toLowerCase())
  );

  // Fetch Firestore users
  const usersSnap = await getDocs(collection(db, 'users'));
  const firestoreUsers = new Map<string, { name: string; isMember: boolean; membershipPaidDate?: string }>();
  usersSnap.forEach(doc => {
    const data = doc.data();
    firestoreUsers.set((data.email as string).toLowerCase(), {
      name: data.name as string,
      isMember: data.isMember as boolean,
      membershipPaidDate: data.membershipPaidDate as string | undefined,
    });
  });

  const firestoreEmails = new Set(firestoreUsers.keys());

  // In TSV but not in Firestore
  const missingFromFirestore = [...tsvEmails].filter(e => !firestoreEmails.has(e));
  // In Firestore (as members) but not in TSV
  const missingFromTsv = [...firestoreEmails].filter(e => {
    const u = firestoreUsers.get(e)!;
    return u.isMember && !tsvEmails.has(e);
  });
  // In both
  const inBoth = [...tsvEmails].filter(e => firestoreEmails.has(e));

  console.log(`TSV has ${tsvEmails.size} emails, Firestore has ${firestoreEmails.size} users (${[...firestoreUsers.values()].filter(u => u.isMember).length} members).\n`);

  console.log(`--- In TSV but NOT in Firestore (${missingFromFirestore.length}) ---`);
  for (const e of missingFromFirestore.sort()) {
    console.log(`  ${e}`);
  }

  console.log(`\n--- In Firestore (as member) but NOT in TSV (${missingFromTsv.length}) ---`);
  for (const e of missingFromTsv.sort()) {
    const u = firestoreUsers.get(e)!;
    console.log(`  ${e} (${u.name}, paid: ${u.membershipPaidDate ?? 'N/A'})`);
  }

  console.log(`\n--- In BOTH (${inBoth.length}) ---`);
  for (const e of inBoth.sort()) {
    const u = firestoreUsers.get(e)!;
    console.log(`  ${e} (${u.name}, member: ${u.isMember}, paid: ${u.membershipPaidDate ?? 'N/A'})`);
  }

  process.exit(0);
}

compare().catch(err => {
  console.error(err);
  process.exit(1);
});
