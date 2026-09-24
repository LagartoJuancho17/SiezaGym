#!/usr/bin/env node
/**
 * Falla si hay un archivo .swift que el proyecto de Xcode no compila.
 *
 * `project.yml` toma carpetas enteras, pero las resuelve al generar: el
 * `.pbxproj` lista los archivos uno por uno. Un archivo nuevo que no esté ahí
 * no se compila, y lo peor es cómo falla:
 *
 * - `xcodebuild build` para el simulador puede pasar igual si el archivo no
 *   hace falta para esa configuración.
 * - `xcodebuild test` **pasa sin correr los tests nuevos**, así que el número
 *   de tests sube en tu cabeza y no en la realidad.
 * - Recién revienta al compilar para el dispositivo, con un "cannot find X in
 *   scope" que no dice nada del proyecto.
 *
 * Pasó de verdad: un `git checkout` del .pbxproj para limpiar los UUIDs
 * aleatorios que XcodeGen regenera se llevó puesta el alta de dos archivos.
 *
 *     node ios/scripts/check-project-sync.mjs
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const IOS = resolve(AQUI, "..");
const PBXPROJ = join(IOS, "SiezaGym.xcodeproj", "project.pbxproj");

/** Lo que no es código nuestro: dependencias y salidas de compilación. */
const IGNORAR = /^(build|build-device|build-device2|\.build|DerivedData|SiezaGym\.xcodeproj)/;

function swiftsEn(directorio) {
  const encontrados = [];
  for (const entrada of readdirSync(directorio)) {
    const completo = join(directorio, entrada);
    const relativo = relative(IOS, completo);
    if (IGNORAR.test(relativo)) continue;

    if (statSync(completo).isDirectory()) {
      encontrados.push(...swiftsEn(completo));
    } else if (entrada.endsWith(".swift")) {
      encontrados.push(relativo);
    }
  }
  return encontrados;
}

const proyecto = readFileSync(PBXPROJ, "utf8");
const archivos = swiftsEn(IOS).sort();

// El .pbxproj referencia por nombre de archivo, no por ruta: con que aparezca
// el basename alcanza (y XcodeGen ya impide dos archivos con el mismo nombre).
const faltan = archivos.filter((ruta) => {
  const nombre = ruta.split("/").pop();
  return !proyecto.includes(`path = ${nombre};`);
});

if (faltan.length) {
  console.error(`${faltan.length} archivo(s) .swift fuera del proyecto de Xcode:\n`);
  faltan.forEach((ruta) => console.error(`  - ${ruta}`));
  console.error("\nCorré:  cd ios && xcodegen generate   (y commiteá el .pbxproj)");
  process.exit(1);
}

console.log(`${archivos.length} archivos .swift, todos en el proyecto.`);
