/**
 * One-off migration script to convert terrain images from Firebase Storage URLs
 * to base64 data URLs stored directly in Firestore.
 *
 * This fetches each uploadedImageUrl, converts it to base64, and updates the
 * Firestore document. After running, you can safely delete the Storage bucket.
 *
 * Run with: npx tsx src/scripts/migrateTerrainImages.ts <email> <password>
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

async function fetchImageAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
  const buffer = await response.arrayBuffer();
  const contentType = response.headers.get('content-type') || 'image/jpeg';
  const base64 = Buffer.from(buffer).toString('base64');
  return `data:${contentType};base64,${base64}`;
}

async function migrate() {
  const [, , email, password] = process.argv;
  if (!email || !password) {
    console.error('Usage: npx tsx src/scripts/migrateTerrainImages.ts <email> <password>');
    process.exit(1);
  }

  await signInWithEmailAndPassword(auth, email, password);
  console.log('Signed in.\n');

  const snapshot = await getDocs(collection(db, 'terrainBoxes'));
  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const url = data.uploadedImageUrl;

    if (!url || typeof url !== 'string') {
      skipped++;
      console.log(`  SKIP: ${docSnap.id} (${data.name}) — no uploaded image`);
      continue;
    }

    // Already a data URL (already migrated)
    if (url.startsWith('data:')) {
      skipped++;
      console.log(`  SKIP: ${docSnap.id} (${data.name}) — already base64`);
      continue;
    }

    try {
      console.log(`  Fetching: ${docSnap.id} (${data.name})...`);
      const dataUrl = await fetchImageAsBase64(url);
      const sizeKb = Math.round(dataUrl.length / 1024);
      console.log(`    → base64 size: ${sizeKb} KB`);

      if (dataUrl.length > 900_000) {
        console.warn(`    ⚠ WARNING: base64 is ${sizeKb} KB — close to Firestore 1MB doc limit!`);
      }

      await updateDoc(doc(db, 'terrainBoxes', docSnap.id), { uploadedImageUrl: dataUrl });
      migrated++;
      console.log(`    ✓ Migrated`);
    } catch (err) {
      failed++;
      console.error(`    ✗ FAILED: ${err}`);
    }
  }

  console.log(`\nDone. Migrated: ${migrated}, Skipped: ${skipped}, Failed: ${failed}`);
  console.log('\nIf all images migrated successfully, you can now delete the Storage bucket:');
  console.log('  gcloud storage rm -r gs://axes-and-ales-booking-site.firebasestorage.app');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
