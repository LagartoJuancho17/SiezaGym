import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebase/firestore";

const COLLECTION = "items";

function serializeItem(doc) {
  const data = doc.data();

  return {
    id: doc.id,
    title: data.title || "",
    description: data.description || "",
    status: data.status || "pending",
    userId: data.userId,
    createdAt: data.createdAt?.toDate?.().toISOString() || null,
    updatedAt: data.updatedAt?.toDate?.().toISOString() || null,
  };
}

export async function listUserItems(userId) {
  const snapshot = await getDb()
    .collection(COLLECTION)
    .where("userId", "==", userId)
    .get();

  return snapshot.docs
    .map(serializeItem)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

export async function getUserItem(userId, itemId) {
  const doc = await getDb().collection(COLLECTION).doc(itemId).get();

  if (!doc.exists) {
    return null;
  }

  const item = serializeItem(doc);

  if (item.userId !== userId) {
    return null;
  }

  return item;
}

export async function createUserItem(userId, data) {
  const now = FieldValue.serverTimestamp();

  await getDb().collection(COLLECTION).add({
    userId,
    title: data.title,
    description: data.description,
    status: data.status,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateUserItem(userId, itemId, data) {
  const docRef = getDb().collection(COLLECTION).doc(itemId);
  const doc = await docRef.get();

  if (!doc.exists || doc.data().userId !== userId) {
    throw new Error("Item not found.");
  }

  await docRef.update({
    title: data.title,
    description: data.description,
    status: data.status,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function deleteUserItem(userId, itemId) {
  const docRef = getDb().collection(COLLECTION).doc(itemId);
  const doc = await docRef.get();

  if (!doc.exists || doc.data().userId !== userId) {
    throw new Error("Item not found.");
  }

  await docRef.delete();
}
