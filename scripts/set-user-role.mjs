#!/usr/bin/env node
// Grant/revoke a boolean role flag (isAdmin, isCoach, ...) on a user's Firestore doc, by email.
// Usage: node --env-file=.env.local scripts/set-user-role.mjs <email> [field] [true|false]
// Defaults: field=isAdmin, value=true

import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

function cleanEnvVar(val) {
  if (!val) return undefined;
  let clean = val.trim();
  if (
    (clean.startsWith('"') && clean.endsWith('"')) ||
    (clean.startsWith("'") && clean.endsWith("'"))
  ) {
    clean = clean.slice(1, -1);
  }
  return clean;
}

const [, , email, field = "isAdmin", valueArg = "true"] = process.argv;

if (!email) {
  console.error("Uso: node --env-file=.env.local scripts/set-user-role.mjs <email> [field] [true|false]");
  process.exit(1);
}

const value = valueArg !== "false";

const projectId = cleanEnvVar(process.env.FIREBASE_PROJECT_ID);
const clientEmail = cleanEnvVar(process.env.FIREBASE_CLIENT_EMAIL);
const privateKey = cleanEnvVar(process.env.FIREBASE_PRIVATE_KEY)?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error("Faltan FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY. Correr con --env-file=.env.local");
  process.exit(1);
}

const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const auth = getAuth(app);
const db = getFirestore(app);

const authUser = await auth.getUserByEmail(email).catch(() => null);

if (!authUser) {
  console.error(`No existe un usuario de Firebase Auth con email ${email}. Tiene que haber iniciado sesión en la app al menos una vez.`);
  process.exit(1);
}

const docRef = db.collection("users").doc(authUser.uid);
const before = await docRef.get();

await docRef.set(
  { [field]: value, updatedAt: FieldValue.serverTimestamp() },
  { merge: true },
);

console.log(`OK: ${email} (uid ${authUser.uid}) -> ${field}=${value}`);
console.log(`Doc ${before.exists ? "existía" : "no existía, se creó con merge"}. Valor anterior de ${field}: ${before.exists ? (before.data()[field] ?? "(sin definir)") : "N/A"}`);
