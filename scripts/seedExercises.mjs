// Siembra la coleccion `exercises` en Firestore desde scripts/seed/exercises-data.mjs.
// Uso: node --env-file=.env --env-file=.env.local scripts/seedExercises.mjs
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import {
  EXERCISES,
  MUSCLE_GROUPS,
  EQUIPMENT,
  PATTERNS,
  REGISTRATION_TYPES,
} from "./seed/exercises-data.mjs";
import { MEDIA_MAP } from "./seed/media-map.mjs";
import { slugify, normalizeSearchText } from "../lib/text/normalize.js";

function validate(exercises) {
  const errors = [];
  const seenIds = new Set();

  for (const [i, e] of exercises.entries()) {
    const label = `#${i} ${e.nameEs}`;
    const sum = Object.values(e.muscleWeights).reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 1) > 0.001) {
      errors.push(`${label}: muscleWeights suman ${sum}, no 1.0`);
    }
    for (const key of Object.keys(e.muscleWeights)) {
      if (!MUSCLE_GROUPS.includes(key)) errors.push(`${label}: grupo muscular invalido "${key}"`);
    }
    if (!EQUIPMENT.includes(e.equipment)) errors.push(`${label}: equipamiento invalido "${e.equipment}"`);
    if (!PATTERNS.includes(e.pattern)) errors.push(`${label}: patron invalido "${e.pattern}"`);
    if (!REGISTRATION_TYPES.includes(e.registrationType)) {
      errors.push(`${label}: registrationType invalido "${e.registrationType}"`);
    }

    const id = slugify(e.nameEs);
    if (seenIds.has(id)) errors.push(`${label}: id duplicado "${id}"`);
    seenIds.add(id);
  }

  return errors;
}

function getAdminApp() {
  if (getApps().length) return getApps()[0];

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Faltan variables FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY. Corre con: node --env-file=.env --env-file=.env.local scripts/seedExercises.mjs",
    );
  }

  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

async function main() {
  const errors = validate(EXERCISES);
  if (errors.length) {
    console.error(`${errors.length} error(es) de validacion, no se escribe nada:\n`);
    errors.forEach((e) => console.error(" -", e));
    process.exit(1);
  }

  const db = getFirestore(getAdminApp());
  const batch = db.batch();
  const now = FieldValue.serverTimestamp();

  for (const e of EXERCISES) {
    const id = slugify(e.nameEs);
    const ref = db.collection("exercises").doc(id);
    batch.set(ref, {
      nameEs: e.nameEs,
      nameEn: e.nameEn,
      equipment: e.equipment,
      pattern: e.pattern,
      muscleWeights: e.muscleWeights,
      registrationType: e.registrationType,
      unilateral: e.unilateral,
      descriptionEs: e.descriptionEs,
      descriptionEn: e.descriptionEn,
      mediaUrl: MEDIA_MAP[e.nameEs] || null,
      mediaAttribution: MEDIA_MAP[e.nameEs] ? "© Gym visual — https://gymvisual.com/" : null,
      searchTextEs: normalizeSearchText(e.nameEs),
      searchTextEn: normalizeSearchText(e.nameEn),
      source: "seed",
      createdAt: now,
      updatedAt: now,
    });
  }

  await batch.commit();
  console.log(`Sembrados ${EXERCISES.length} ejercicios en la coleccion "exercises" (proyecto ${process.env.FIREBASE_PROJECT_ID}).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
