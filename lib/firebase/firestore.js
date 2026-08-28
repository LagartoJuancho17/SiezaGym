import { getFirestore } from "firebase-admin/firestore";
import { getAdminApp } from "./admin";

export function getDb() {
  return getFirestore(getAdminApp());
}
