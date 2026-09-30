#!/usr/bin/env node
// Registra (si hace falta) la app Android en el proyecto de Firebase y baja el
// google-services.json a android/app/.
//
// Ese archivo NO esta en el repo: aunque Google no lo considera secreto, este
// repositorio es publico y la clave quedaria indexada. Se regenera con:
//
//   node --env-file=.env --env-file=.env.local android/scripts/fetch-google-services-json.mjs
//
// Necesita las mismas credenciales de service account que usa la web
// (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY en .env.local).

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleAuth } from "google-auth-library";

const PACKAGE_NAME = "com.siezagym.app";
const OUTPUT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../app/google-services.json",
);

const clean = (value) => (value || "").trim().replace(/,$/, "").replace(/^["']|["']$/g, "");

const projectId = clean(process.env.FIREBASE_PROJECT_ID);
const clientEmail = clean(process.env.FIREBASE_CLIENT_EMAIL);
const privateKey = clean(process.env.FIREBASE_PRIVATE_KEY).replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error("Faltan FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY.");
  console.error("Corré el script con: node --env-file=.env --env-file=.env.local android/scripts/fetch-google-services-json.mjs");
  process.exit(1);
}

const auth = new GoogleAuth({
  credentials: { client_email: clientEmail, private_key: privateKey },
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
});
const client = await auth.getClient();
const base = `https://firebase.googleapis.com/v1beta1/projects/${projectId}`;

const call = async (url, method = "GET", data) => (await client.request({ url, method, data })).data;

const list = await call(`${base}/androidApps`);
let app = (list.apps || []).find((item) => item.packageName === PACKAGE_NAME) || null;

if (!app) {
  console.log(`Registrando la app Android ${PACKAGE_NAME}...`);
  let operation = await call(`${base}/androidApps`, "POST", {
    packageName: PACKAGE_NAME,
    displayName: "SiezaGym Android",
  });
  for (let attempt = 0; attempt < 30 && !operation.done; attempt += 1) {
    await new Promise((done) => setTimeout(done, 2000));
    operation = await call(`https://firebase.googleapis.com/v1beta1/${operation.name}`);
  }
  if (!operation.done) throw new Error("La creación de la app no terminó a tiempo.");
  if (operation.error) throw new Error(JSON.stringify(operation.error));
  app = operation.response;
}

const config = await call(`${base}/androidApps/${app.appId}/config`);
mkdirSync(dirname(OUTPUT), { recursive: true });
writeFileSync(OUTPUT, Buffer.from(config.configFileContents, "base64"));

console.log(`appId     ${app.appId}`);
console.log(`package   ${app.packageName}`);
console.log(`config    ${OUTPUT}`);