import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebase/firestore";

const COLLECTION = "users";

function serializeUser(doc) {
  const data = doc.data();
  return {
    uid: doc.id,
    email: data.email || null,
    displayName: data.displayName || null,
    photoURL: data.photoURL || null,
    provider: data.provider || null,
    isCoach: data.isCoach || false,
    isAdmin: data.isAdmin || false,
    createdAt: data.createdAt?.toDate?.().toISOString() || null,
    updatedAt: data.updatedAt?.toDate?.().toISOString() || null,
    lastLoginAt: data.lastLoginAt?.toDate?.().toISOString() || null,
  };
}

export async function getUserProfile(uid) {
  const doc = await getDb().collection(COLLECTION).doc(uid).get();
  if (!doc.exists) {
    return null;
  }
  return serializeUser(doc);
}

export async function ensureUserProfile({ uid, email, displayName, photoURL, provider }) {
  const docRef = getDb().collection(COLLECTION).doc(uid);
  const doc = await docRef.get();
  const now = FieldValue.serverTimestamp();

  if (!doc.exists) {
    await docRef.set({
      email: email || null,
      displayName: displayName || null,
      photoURL: photoURL || null,
      provider: provider || "password",
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
    });
    return;
  }

  const existing = doc.data();
  await docRef.set(
    {
      email: email || existing.email || null,
      displayName: displayName || existing.displayName || null,
      photoURL: photoURL || existing.photoURL || null,
      updatedAt: now,
      lastLoginAt: now,
    },
    { merge: true },
  );
}
