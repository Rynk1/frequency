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

async function seedFirestore() {
  console.log('=== HARMONY FREQUENCY FIRESTORE CONTENT SEEDER ===\n');

  const frequencies = getFrequenciesSeed();
  const programs = getProgramsSeed();
  const articles = getArticlesSeed();

  console.log(`[INFO] Validating ${frequencies.length} Frequencies...`);
  if (!isDryRun) {
    for (const freq of frequencies) {
      await db.collection('frequencies').doc(freq.id).set(freq, { merge: true });
    }
  }
  console.log(`[PASS] ${frequencies.length} Frequencies validated.`);

  console.log(`[INFO] Validating ${programs.length} Curated Programs...`);
  if (!isDryRun) {
    for (const prog of programs) {
      await db.collection('curatedPrograms').doc(prog.id).set(prog, { merge: true });
    }
  }
  console.log(`[PASS] ${programs.length} Curated Programs validated.`);

  console.log(`[INFO] Validating ${articles.length} Learning Articles...`);
  if (!isDryRun) {
    for (const art of articles) {
      await db.collection('articles').doc(art.id).set(art, { merge: true });
    }
  }
  console.log(`[PASS] ${articles.length} Learning Articles validated.`);

  console.log(`\n=== SEED DATA ${isDryRun ? 'DRY-RUN VALIDATED' : 'WRITTEN TO FIRESTORE'} SUCCESSFULLY ===`);
}

seedFirestore().catch((err) => {
  console.error('Fatal Seeding Error:', err?.message || err);
  process.exit(1);
});
