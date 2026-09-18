#!/usr/bin/env node
/**
 * Genera los temas de la app de Android a partir del CSS de la web.
 *
 * La app nativa no comparte hoja de estilos con la web, así que los colores
 * tendrían que copiarse a mano y se desincronizarían al primer retoque. Este
 * script lee app/design2.css, saca las variables de cada tema y escribe
 * ThemeTokens.kt. Si cambia un tema en la web, se vuelve a correr y listo.
 *
 *   node android/scripts/sync-theme.mjs --css ../SiezaGym/app/design2.css
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const cssArg = args[args.indexOf("--css") + 1];
const CSS = resolve(AQUI, "..", "..", cssArg || "app/design2.css");
const SALIDA = resolve(AQUI, "..", "app", "src", "main", "kotlin", "com", "siezagym", "app", "DesignSystem", "ThemeTokens.kt");

const css = readFileSync(CSS, "utf8");

/** Las variables que la app nativa necesita. El resto del CSS no se usa acá. */
const VARIABLES = [
  "glass-1", "glass-2", "glass-3",
  "border", "border-strong",
  "text", "text-2", "text-3",
  "ink", "on-ink",
  "bg-grad", "bg-a", "bg-b", "bg-c",
  "blob-1", "blob-2", "blob-3",
  "ground",
];

/** El bloque de variables de un selector, sin comentarios. */
function bloque(selector) {
  const inicio = css.indexOf(selector);
  if (inicio === -1) throw new Error(`No está el selector ${selector}`);
  const abre = css.indexOf("{", inicio);
  const cierra = css.indexOf("\n}", abre);
  return css.slice(abre + 1, cierra).replace(/\/\*[\s\S]*?\*\//g, "");
}

function variables(texto) {
  const salida = {};
  for (const nombre of VARIABLES) {
    // El valor puede ocupar varias líneas (los degradados).
    const re = new RegExp(`--d2-${nombre}:\\s*([^;]+);`);
    const m = texto.match(re);
    if (m) salida[nombre] = m[1].trim().replace(/\s+/g, " ");
  }
  return salida;
}

/** #rrggbb, #rgb o rgba(r, g, b, a) -> (rojo, verde, azul, alfa) 0...255. */
function color(valor) {
  const hex = valor.match(/^#([0-9a-fA-F]{6})$/);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
  }
  const corto = valor.match(/^#([0-9a-fA-F]{3})$/);
  if (corto) {
    const [r, g, b] = [...corto[1]].map((c) => parseInt(c + c, 16));
    return [r, g, b, 255];
  }
  const rgba = valor.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,/\s]+([\d.]+))?\s*\)/);
  if (rgba) {
    const alfa = rgba[4] === undefined ? 1 : Number(rgba[4]);
    return [Number(rgba[1]), Number(rgba[2]), Number(rgba[3]), Math.round(alfa * 255)];
  }
  return null;
}

function corColor(valor, porDefecto = "Color.Transparent") {
  const c = color(valor);
  if (!c) return porDefecto;
  const [r, g, b, a] = c;
  return `Color(${r}, ${g}, ${b}, ${a})`;
}

/**
 * Los degradados lineales de la web salen como lista de paradas.
 * El ángulo de CSS (168deg) se convierte a los puntos de inicio y fin que usa
 * Compose, que no entiende grados.
 */
function degradado(valor) {
  if (!valor || !valor.startsWith("linear-gradient")) return null;
  const adentro = valor.slice(valor.indexOf("(") + 1, valor.lastIndexOf(")"));
  const partes = adentro.split(/,(?![^(]*\))/).map((p) => p.trim());
  const gradosM = partes[0].match(/^([\d.]+)deg$/);
  const grados = gradosM ? Number(gradosM[1]) : 180;
  const paradas = (gradosM ? partes.slice(1) : partes).map((p) => {
    const m = p.match(/^(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\))\s*([\d.]+)%?$/);
    if (m) return { color: m[1], posicion: Number(m[2]) / 100 };
    return { color: p.split(/\s+/)[0], posicion: null };
  });
  // Reparte las paradas sin posición explícita.
  paradas.forEach((p, i) => {
    if (p.posicion === null) p.posicion = paradas.length === 1 ? 0 : i / (paradas.length - 1);
  });
  return { grados, paradas };
}

/** 0deg en CSS apunta hacia arriba y gira en sentido horario. */
function puntos(grados) {
  const rad = ((grados - 90) * Math.PI) / 180;
  const dx = Math.cos(rad) / 2;
  const dy = Math.sin(rad) / 2;
  return {
    inicio: `${(0.5 - dx).toFixed(4)}f to ${(0.5 - dy).toFixed(4)}f`,
    fin: `${(0.5 + dx).toFixed(4)}f to ${(0.5 + dy).toFixed(4)}f`,
  };
}

// El selector aparece también en reglas sueltas (`... .d2-blob`), así que se
// quitan repetidos y se queda solo con los bloques que declaran variables.
const TEMAS = [...new Set([...css.matchAll(/\.d2\[data-d2-theme="([a-z]+)"\]/g)].map((m) => m[1]))]
  .filter((id) => bloque(`.d2[data-d2-theme="${id}"]`).includes("--d2-ink:"));
const base = variables(bloque(".d2 {"));

const cuerpos = TEMAS.map((id) => {
  const v = { ...base, ...variables(bloque(`.d2[data-d2-theme="${id}"]`)) };
  const grad = degradado(v["bg-grad"]);
  const p = grad ? puntos(grad.grados) : puntos(180);
  const paradas = grad
    ? grad.paradas
        .map((s) => `        ColorStop(${corColor(s.color)}, ${s.posicion.toFixed(3)}f)`)
        .join(",\n")
    : `        ColorStop(${corColor(v["bg-grad"], "Color.Black")}, 0f)`;

  // La obra de fondo de los temas que la traen: en Android se guarda como
  // imagen en res/drawable-nodpi, con el mismo nombre en snake_case.
  const obra = v.ground && v.ground.includes("url(") ? `"${id}"` : "null";

  return `    D2Theme(
        id = "${id}",
        nombre = "${nombre(id)}",
        glass1 = ${v["glass-1"]}f,
        glass2 = ${v["glass-2"]}f,
        glass3 = ${v["glass-3"]}f,
        borde = ${corColor(v.border)},
        bordeFuerte = ${corColor(v["border-strong"])},
        texto = ${corColor(v.text)},
        texto2 = ${corColor(v["text-2"])},
        texto3 = ${corColor(v["text-3"])},
        solido = ${corColor(v.ink)},
        sobreSolido = ${corColor(v["on-ink"])},
        luzA = ${corColor(v["bg-a"])},
        luzB = ${corColor(v["bg-b"])},
        luzC = ${corColor(v["bg-c"])},
        mancha1 = ${corColor(v["blob-1"])},
        mancha2 = ${corColor(v["blob-2"])},
        mancha3 = ${corColor(v["blob-3"])},
        fondoInicio = ${p.inicio},
        fondoFin = ${p.fin},
        fondo = listOf(
${paradas}
        ),
        obra = ${obra}
    )`;
});

function nombre(id) {
  return { noche: "Noche", plata: "Plata", brasa: "Brasa", electrico: "Eléctrico", pliegues: "Pliegues" }[id] || id;
}

const kotlin = `// GENERADO por android/scripts/sync-theme.mjs — no editar a mano.
//
// Los colores salen de app/design2.css, que es la fuente de verdad de los dos
// clientes. Si cambia un tema en la web, correr:
//
//     node android/scripts/sync-theme.mjs --css ../SiezaGym/app/design2.css
//
// Temas encontrados: ${TEMAS.join(", ")}

package com.siezagym.app.DesignSystem

import androidx.compose.ui.graphics.Color

/** El tema elegido por defecto cuando no hay preferencia guardada. */
val TemaPorDefecto: D2Theme = TemasTokens.firstOrNull { it.id == "plata" } ?: TemasTokens[0]

/** Todos los temas del diseño, en el mismo orden que el selector de la web. */
val TemasTokens: List<D2Theme> = listOf(
${cuerpos.join(",\n")}
)
`;

writeFileSync(SALIDA, kotlin, "utf8");
console.log(`${TEMAS.length} temas -> ${SALIDA.replace(process.cwd() + "/", "")}`);