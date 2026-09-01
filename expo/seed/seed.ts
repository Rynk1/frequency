import * as admin from 'firebase-admin';
import { getFrequenciesSeed } from './frequencies';
import { getProgramsSeed } from './programs';
import { getArticlesSeed } from './articles';

const isDryRun = process.argv.includes('--dry-run');

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.GCP_PROJECT || process.env.FIREBASE_PROJECT_ID || 'harmony-frequency-app',
  });
}

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

async function safeMergeCollection(collectionName: string, items: any[]) {
  console.log(`[INFO] Seeding ${items.length} records into '${collectionName}'...`);
  let written = 0;
  let skipped = 0;

  for (const item of items) {
    if (isDryRun) {
      written++;
      continue;
    }

    const docRef = db.collection(collectionName).doc(item.id);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const existingData = docSnap.data() || {};
      // Protected Check: Never overwrite admin-created or admin-edited records
      if (existingData.provenance === 'admin' || existingData.updatedBy === 'admin') {
        console.log(`  [PROTECTED] Skipping admin-edited doc: ${collectionName}/${item.id}`);
        skipped++;
        continue;
      }

      // Version Check: Only merge if seed version is greater
      const existingVersion = existingData.seedVersion || 0;
      if (item.seedVersion && item.seedVersion <= existingVersion) {
        console.log(`  [UP-TO-DATE] Skipping doc ${collectionName}/${item.id} (v${existingVersion})`);
        skipped++;
        continue;
      }
    }

    await docRef.set(item, { merge: true });
    written++;
  }

  console.log(`[PASS] ${collectionName}: ${written} written/validated, ${skipped} protected/skipped.`);
}

async function seedFirestore() {
  console.log('=== HARMONY FREQUENCY NON-DESTRUCTIVE FIRESTORE SEEDER ===\n');

  const frequencies = getFrequenciesSeed();
  const programs = getProgramsSeed();
  const articles = getArticlesSeed();

  await safeMergeCollection('frequencies', frequencies);
  await safeMergeCollection('curatedPrograms', programs);
  await safeMergeCollection('articles', articles);

  console.log(`\n=== SEED DATA ${isDryRun ? 'DRY-RUN VALIDATED' : 'SAFE-MERGED TO FIRESTORE'} SUCCESSFULLY ===`);
}

seedFirestore().catch((err) => {
  console.error('Fatal Seeding Error:', err?.message || err);
  process.exit(1);
});
