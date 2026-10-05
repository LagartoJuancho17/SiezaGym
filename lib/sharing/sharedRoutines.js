import { randomBytes } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebase/firestore";
import { createRoutine, sanitizeExercises } from "@/lib/routines/routines";

/**
 * Rutinas compartidas por link (`/r/<id>`).
 *
 * Al compartir se guarda una copia congelada en `sharedRoutines/{id}`: quien
 * abre el link ve la rutina como estaba al compartirla, aunque el dueño la
 * cambie o la borre después. Volver a compartir la misma rutina actualiza la
 * copia y conserva el link, así no se multiplican links viejos.
 *
 * Todo pasa por el Admin SDK (API y páginas del servidor): la colección no
 * necesita reglas de cliente.
 */

const COLLECTION = "sharedRoutines";
// Sin 0/O ni 1/l/I: el link a veces se dicta o se copia a mano.
const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";
export const SHARE_ID_LENGTH = 10;
export const MAX_SHARED_EXERCISES = 40;
export const PUBLIC_ORIGIN = "https://sieza-gym.vercel.app";

export function newShareId(bytes = randomBytes(SHARE_ID_LENGTH)) {
  return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join("");
}

export function isValidShareId(value) {
  return typeof value === "string" && new RegExp(`^[${ALPHABET}]{${SHARE_ID_LENGTH}}$`).test(value);
}

export function shareUrl(id, origin = PUBLIC_ORIGIN) {
  return `${origin.replace(/\/$/, "")}/r/${id}`;
}

/**
 * Lo que se guarda: nombre, nota y ejercicios saneados con la misma función
 * que las rutinas propias, más el nombre de cada ejercicio para mostrarlo sin
 * depender del catálogo de quien lo abre.
 */
export function buildSharedSnapshot({ name, note, exercises, exerciseNames = {} }, owner) {
  const trimmed = String(name || "").trim().slice(0, 80);
  if (!trimmed) throw new Error("La rutina no tiene nombre.");
  const clean = sanitizeExercises(exercises).slice(0, MAX_SHARED_EXERCISES).filter((e) => e.exerciseId);
  if (!clean.length) throw new Error("La rutina no tiene ejercicios.");
  const names = {};
  for (const exercise of clean) {
    const label = exerciseNames?.[exercise.exerciseId];
    if (typeof label === "string" && label.trim()) names[exercise.exerciseId] = label.trim().slice(0, 80);
  }
  return {
    name: trimmed,
    note: String(note || "").trim().slice(0, 300),
    exercises: clean,
    exerciseNames: names,
    ownerId: owner.uid,
    ownerName: owner.displayName || "Alguien",
  };
}

/** Los ejercicios que se pueden copiar: los del catálogo, no los propios de otro. */
export function importableExercises(exercises, catalogIds) {
  return (exercises || []).filter(
    (exercise) => exercise.exerciseSource !== "custom" && catalogIds.has(exercise.exerciseId),
  );
}

export async function shareRoutine(owner, routine) {
  const snapshot = buildSharedSnapshot(routine, owner);
  const sourceId = typeof routine.sourceId === "string" ? routine.sourceId.slice(0, 64) : null;
  const db = getDb();

  if (sourceId) {
    const existing = await db
      .collection(COLLECTION)
      .where("ownerId", "==", owner.uid)
      .where("sourceId", "==", sourceId)
      .limit(1)
      .get();
    if (!existing.empty) {
      const doc = existing.docs[0];
      await doc.ref.update({ ...snapshot, updatedAt: FieldValue.serverTimestamp() });
      return doc.id;
    }
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const id = newShareId();
    try {
      await db.collection(COLLECTION).doc(id).create({
        ...snapshot,
        sourceId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        imports: 0,
      });
      return id;
    } catch (error) {
      const conflict = error?.code === 6 || error?.code === "already-exists" || /already exists/i.test(error?.message || "");
      if (!conflict) throw error;
    }
  }
  throw new Error("No se pudo crear el link. Probá de nuevo.");
}

export async function getSharedRoutine(id) {
  if (!isValidShareId(id)) return null;
  const doc = await getDb().collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    note: data.note || "",
    exercises: data.exercises || [],
    exerciseNames: data.exerciseNames || {},
    ownerName: data.ownerName || "Alguien",
    ownerId: data.ownerId,
    updatedAt: data.updatedAt?.toDate?.().toISOString() || null,
  };
}

/** Copia la rutina compartida a las rutinas de `userId`. Devuelve el id nuevo. */
export async function importSharedRoutine(userId, id, catalogIds) {
  const shared = await getSharedRoutine(id);
  if (!shared) throw new Error("El link no existe o se borró.");
  const exercises = importableExercises(shared.exercises, catalogIds);
  if (!exercises.length) throw new Error("Ningún ejercicio de esta rutina está en el catálogo.");
  const routineId = await createRoutine(userId, { name: shared.name, note: shared.note, exercises });
  await getDb().collection(COLLECTION).doc(id).update({ imports: FieldValue.increment(1) }).catch(() => {});
  return routineId;
}
