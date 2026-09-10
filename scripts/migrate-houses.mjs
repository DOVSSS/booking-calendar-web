/**
 * Seed houses + migrate existing bookings/expenses/todos to the first house.
 *
 * Usage:
 *   node --env-file=.env scripts/migrate-houses.mjs
 *
 * Or set VITE_FIREBASE_* / FIREBASE_* env vars manually.
 */
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
  query,
  where,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
  appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('Missing Firebase config. Set VITE_FIREBASE_* env vars or use --env-file=.env');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const DEFAULT_HOUSES = ['Домик 1', 'Домик 2', 'Домик 3'];
const COLLECTIONS_TO_MIGRATE = ['bookings', 'expenses', 'todos'];

async function ensureHouses() {
  const snapshot = await getDocs(collection(db, 'houses'));
  const existing = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

  if (existing.length > 0) {
    console.log(`Found ${existing.length} house(s):`);
    existing.forEach((h) => console.log(`  - ${h.id}: ${h.name}`));
    // Prefer "Домик 1" as first if present, else earliest createdAt / first doc
    const sorted = [...existing].sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() ?? a.createdAt?.seconds ?? 0;
      const bTime = b.createdAt?.toMillis?.() ?? b.createdAt?.seconds ?? 0;
      return aTime - bTime;
    });
    return sorted;
  }

  console.log('No houses found. Creating default houses...');
  const created = [];
  for (const name of DEFAULT_HOUSES) {
    const ref = await addDoc(collection(db, 'houses'), {
      name,
      createdAt: Timestamp.now(),
    });
    created.push({ id: ref.id, name });
    console.log(`  Created ${ref.id}: ${name}`);
  }
  return created;
}

async function migrateCollection(collectionName, houseId) {
  const snapshot = await getDocs(collection(db, collectionName));
  let updated = 0;
  let skipped = 0;

  for (const document of snapshot.docs) {
    const data = document.data();
    if (data.houseId) {
      skipped += 1;
      continue;
    }
    await updateDoc(doc(db, collectionName, document.id), { houseId });
    updated += 1;
  }

  console.log(`${collectionName}: updated ${updated}, skipped ${skipped} (already had houseId)`);
}

async function main() {
  console.log('=== Multi-house migration ===');
  console.log(`Project: ${firebaseConfig.projectId}`);

  const houses = await ensureHouses();
  const firstHouseId = houses[0].id;
  console.log(`\nMigrating data to first house: ${firstHouseId} (${houses[0].name})\n`);

  for (const name of COLLECTIONS_TO_MIGRATE) {
    await migrateCollection(name, firstHouseId);
  }

  // Sanity check: count docs per house for bookings
  const bookingsSnap = await getDocs(
    query(collection(db, 'bookings'), where('houseId', '==', firstHouseId))
  );
  console.log(`\nBookings with houseId=${firstHouseId}: ${bookingsSnap.size}`);
  console.log('Done. Reviews were not modified.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
