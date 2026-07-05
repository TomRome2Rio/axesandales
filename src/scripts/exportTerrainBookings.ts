/**
 * Export terrain-box booking usage since a given date.
 *
 * Usage:
 *   npx tsx src/scripts/exportTerrainBookings.ts 2026-01-01 [output-dir] [--include-cancelled]
 *
 * Outputs JSON and CSV files in the chosen output directory.
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

import { initializeApp } from 'firebase/app';
import { collection, getDocsFromServer, getFirestore } from 'firebase/firestore';
import { mkdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

type BookingRecord = {
  date?: unknown;
  terrainBoxId?: unknown;
  gameSystem?: unknown;
  status?: unknown;
};

type TerrainBoxRecord = {
  name?: unknown;
};

type IncludedBooking = {
  date: string;
  terrainBoxId: string | null;
  gameSystem: string;
  status: 'active' | 'cancelled' | string;
};

type TerrainBoxReport = {
  terrainBoxId: string;
  terrainName: string;
  totalBookings: number;
  uniqueNightsBooked: number;
  averageBookingsPerNight: number;
  games: Array<{ gameSystem: string; count: number }>;
};

type ExportReport = {
  generatedAt: string;
  sinceDate: string;
  includeCancelled: boolean;
  totalNights: number;
  totalBookings: number;
  terrainBookings: number;
  terrainBoxes: TerrainBoxReport[];
};

function requireFirebaseConfig(): void {
  const missing = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Missing Firebase env vars: ${missing.join(', ')}. ` +
      'Add them to .env.local before running this script.'
    );
  }
}

function isDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function normalizeBooking(data: BookingRecord): IncludedBooking | null {
  const date = typeof data.date === 'string' ? data.date.trim() : '';
  const gameSystem = typeof data.gameSystem === 'string' ? data.gameSystem.trim() : '';
  const terrainBoxId = typeof data.terrainBoxId === 'string' && data.terrainBoxId.trim()
    ? data.terrainBoxId.trim()
    : null;
  const status = typeof data.status === 'string' ? data.status : 'active';

  if (!isDateString(date) || !gameSystem) {
    return null;
  }

  return {
    date,
    terrainBoxId,
    gameSystem,
    status,
  };
}

function normalizeTerrainBox(data: TerrainBoxRecord, fallbackName: string): string {
  return typeof data.name === 'string' && data.name.trim() ? data.name.trim() : fallbackName;
}

function csvEscape(value: string | number): string {
  const text = String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function buildCsv(report: ExportReport): string {
  const header = [
    'terrainBoxId',
    'terrainName',
    'totalBookings',
    'averageBookingsPerNight',
    'uniqueNightsBooked',
    'games',
  ];

  const rows = report.terrainBoxes.map(row => [
    row.terrainBoxId,
    row.terrainName,
    row.totalBookings,
    row.averageBookingsPerNight.toFixed(2),
    row.uniqueNightsBooked,
    row.games.map(game => `${game.gameSystem} (${game.count})`).join('; '),
  ]);

  return [
    header.map(csvEscape).join(','),
    ...rows.map(row => row.map(csvEscape).join(',')),
  ].join('\n');
}

function formatTableRows(report: ExportReport): Array<Record<string, string | number>> {
  return report.terrainBoxes.map(row => ({
    'Terrain Box': row.terrainName,
    Bookings: row.totalBookings,
    'Avg / Night': row.averageBookingsPerNight.toFixed(2),
    'Nights Booked': row.uniqueNightsBooked,
    Games: row.games.map(game => `${game.gameSystem} (${game.count})`).join('; '),
  }));
}

async function getCollectionDocsFromServer(db: ReturnType<typeof getFirestore>, collectionName: string) {
  try {
    return await getDocsFromServer(collection(db, collectionName));
  } catch (error) {
    throw new Error(
      `Unable to connect to Firestore while reading ${collectionName}. ` +
      `Check your network connection and Firebase access, then try again. ${error instanceof Error ? error.message : ''}`
    );
  }
}

async function main(): Promise<void> {
  const [sinceDateArg, outputDirArg, ...flags] = process.argv.slice(2);

  if (!sinceDateArg || !isDateString(sinceDateArg)) {
    console.error('Usage: npx tsx src/scripts/exportTerrainBookings.ts <YYYY-MM-DD> [output-dir] [--include-cancelled]');
    process.exit(1);
  }

  requireFirebaseConfig();

  const includeCancelled = flags.includes('--include-cancelled');
  const outputDir = resolve(process.cwd(), outputDirArg && !outputDirArg.startsWith('--') ? outputDirArg : 'reports');
  const fileSuffix = includeCancelled ? 'incl-cancelled' : 'active-only';
  const fileBase = `terrain-bookings-since-${sinceDateArg}-${fileSuffix}`;

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const [bookingsSnap, terrainSnap] = await Promise.all([
    getCollectionDocsFromServer(db, 'bookings'),
    getCollectionDocsFromServer(db, 'terrainBoxes'),
  ]);

  const terrainNames = new Map<string, string>();
  terrainSnap.docs.forEach(docSnap => {
    const fallbackName = docSnap.id;
    const name = normalizeTerrainBox(docSnap.data() as TerrainBoxRecord, fallbackName);
    terrainNames.set(docSnap.id, name);
  });

  const allBookings = bookingsSnap.docs
    .map(docSnap => normalizeBooking(docSnap.data() as BookingRecord))
    .filter((booking): booking is IncludedBooking => booking !== null)
    .filter(booking => booking.date >= sinceDateArg)
    .filter(booking => includeCancelled || booking.status !== 'cancelled');

  const reportNights = new Set(allBookings.map(booking => booking.date));
  const terrainBookingList = allBookings.filter(booking => booking.terrainBoxId);
  const grouped = new Map<string, {
    terrainBoxId: string;
    totalBookings: number;
    nights: Set<string>;
    games: Map<string, number>;
  }>();

  terrainBookingList.forEach(booking => {
    const terrainBoxId = booking.terrainBoxId as string;
    const existing = grouped.get(terrainBoxId) ?? {
      terrainBoxId,
      totalBookings: 0,
      nights: new Set<string>(),
      games: new Map<string, number>(),
    };

    existing.totalBookings += 1;
    existing.nights.add(booking.date);
    existing.games.set(booking.gameSystem, (existing.games.get(booking.gameSystem) ?? 0) + 1);
    grouped.set(terrainBoxId, existing);
  });

  const terrainBoxes = [...grouped.values()]
    .map(entry => {
      const terrainName = terrainNames.get(entry.terrainBoxId) ?? entry.terrainBoxId;
      const games = [...entry.games.entries()]
        .map(([gameSystem, count]) => ({ gameSystem, count }))
        .sort((a, b) => b.count - a.count || a.gameSystem.localeCompare(b.gameSystem, undefined, { sensitivity: 'base' }));

      return {
        terrainBoxId: entry.terrainBoxId,
        terrainName,
        totalBookings: entry.totalBookings,
        uniqueNightsBooked: entry.nights.size,
        averageBookingsPerNight: reportNights.size > 0 ? entry.totalBookings / reportNights.size : 0,
        games,
      };
    })
    .sort((a, b) => b.totalBookings - a.totalBookings || a.terrainName.localeCompare(b.terrainName, undefined, { sensitivity: 'base' }));

  const report: ExportReport = {
    generatedAt: new Date().toISOString(),
    sinceDate: sinceDateArg,
    includeCancelled,
    totalNights: reportNights.size,
    totalBookings: allBookings.length,
    terrainBookings: terrainBookingList.length,
    terrainBoxes,
  };

  mkdirSync(outputDir, { recursive: true });
  const jsonPath = resolve(outputDir, `${fileBase}.json`);
  const csvPath = resolve(outputDir, `${fileBase}.csv`);

  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  writeFileSync(csvPath, `${buildCsv(report)}\n`, 'utf8');

  console.log(`Exported ${report.terrainBookings} terrain bookings across ${report.totalNights} nights since ${sinceDateArg}.`);
  console.log(`Wrote ${jsonPath}`);
  console.log(`Wrote ${csvPath}`);

  if (report.terrainBoxes.length === 0) {
    console.log('No terrain boxes were booked in the selected period.');
  } else {
    console.table(formatTableRows(report));
  }
}

main().catch(err => {
  console.error('Terrain booking export failed:', err);
  process.exit(1);
});
