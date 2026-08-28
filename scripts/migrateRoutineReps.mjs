// One-off: normaliza rutinas ya guardadas con el shape viejo por ejercicio
// (targetRepRangeLow/High + restSeconds) al nuevo (targetReps unico, sin
// restSeconds). No borra ni reordena ejercicios, solo normaliza los campos
// de configuracion de cada uno. Idempotente -- correrlo de nuevo no rompe
// nada, los items que ya tienen targetReps se dejan igual.
// Uso: node --env-file=.env --env-file=.env.local scripts/migrateRoutineReps.mjs
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

function getAdminApp() {
  if (getApps().length) return getApps()[0];
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Faltan variables FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY.");
  }
  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

function migrateExercise(e) {
  if (e.targetReps != null) return { changed: false, exercise: e };
  const low = Number(e.targetRepRangeLow) || 10;
  const high = Number(e.targetRepRangeHigh) || low;
  const targetReps = Math.round((low + high) / 2);
  const { targetRepRangeLow, targetRepRangeHigh, restSeconds, ...rest } = e;
  return { changed: true, exercise: { ...rest, targetReps } };
}

async function main() {
  const db = getFirestore(getAdminApp());
  const snapshot = await db.collection("routines").get();

  console.log(`Revisando ${snapshot.size} rutina(s)...\n`);

  let touched = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const exercises = Array.isArray(data.exercises) ? data.exercises : [];
    const results = exercises.map(migrateExercise);
    const anyChanged = results.some((r) => r.changed);

    if (!anyChanged) {
      console.log(`- "${data.name}" (${doc.id}): ya en formato nuevo, sin cambios.`);
      continue;
    }

    console.log(`- "${data.name}" (${doc.id}): migrando ${results.filter((r) => r.changed).length}/${exercises.length} ejercicio(s).`);
    for (const [i, r] of results.entries()) {
      if (!r.changed) continue;
      const before = exercises[i];
      console.log(
        `    · ${before.exerciseId}: reps ${before.targetRepRangeLow}-${before.targetRepRangeHigh} → targetReps=${r.exercise.targetReps} (rest ${before.restSeconds}s eliminado)`,
      );
    }

    await doc.ref.update({
      exercises: results.map((r) => r.exercise),
      updatedAt: FieldValue.serverTimestamp(),
    });
    touched++;
  }

  console.log(`\nListo. ${touched}/${snapshot.size} rutina(s) migrada(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
