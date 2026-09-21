#!/usr/bin/env node
/**
 * Genera los temas de la app de iPhone a partir del CSS de la web.
 *
 * La app nativa no comparte hoja de estilos con la web, así que los colores
 * tendrían que copiarse a mano y se desincronizarían al primer retoque. Este
 * script lee app/design2.css, saca las variables de cada tema y escribe
 * ThemeTokens.swift. Si cambia un tema en la web, se vuelve a correr y listo.
 *
 *   node ios/scripts/sync-theme.mjs --css ../SiezaGym/app/design2.css
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const cssArg = args[args.indexOf("--css") + 1];
const CSS = resolve(AQUI, "..", "..", cssArg || "../SiezaGym/app/design2.css");
// Vive en lo compartido porque el widget también pinta con estos colores.
const SALIDA = resolve(AQUI, "..", "SiezaGymCompartido", "ThemeTokens.swift");

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

/** #rrggbb, #rgb o rgba(r, g, b, a) -> (rojo, verde, azul, alfa) 0...1 */
function color(valor) {
  const hex = valor.match(/^#([0-9a-fA-F]{6})$/);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
  }
  const corto = valor.match(/^#([0-9a-fA-F]{3})$/);
  if (corto) {
    const [r, g, b] = [...corto[1]].map((c) => parseInt(c + c, 16));
    return [r, g, b, 1];
  }
  const rgba = valor.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,/\s]+([\d.]+))?\s*\)/);
  if (rgba) {
    return [Number(rgba[1]), Number(rgba[2]), Number(rgba[3]), rgba[4] === undefined ? 1 : Number(rgba[4])];
  }
  return null;
}

function swiftColor(valor, porDefecto = "Color.clear") {
  const c = color(valor);
  if (!c) return porDefecto;
  const [r, g, b, a] = c;
  return `Color(r: ${r}, g: ${g}, b: ${b}, a: ${a})`;
}

/**
 * Los degradados lineales de la web salen como lista de paradas.
 * El ángulo de CSS (168deg) se convierte a los puntos de inicio y fin que usa
 * SwiftUI, que no entiende grados.
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
    inicio: `UnitPoint(x: ${(0.5 - dx).toFixed(4)}, y: ${(0.5 - dy).toFixed(4)})`,
    fin: `UnitPoint(x: ${(0.5 + dx).toFixed(4)}, y: ${(0.5 + dy).toFixed(4)})`,
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
        .map((s) => `Gradient.Stop(color: ${swiftColor(s.color)}, location: ${s.posicion.toFixed(3)})`)
        .join(",\n                ")
    : `Gradient.Stop(color: ${swiftColor(v["bg-grad"], "Color.black")}, location: 0)`;

  // La obra de fondo de los temas que la traen: en iOS se guarda como imagen
  // en el catálogo de recursos, con el mismo nombre del tema.
  const obra = v.ground && v.ground.includes("url(") ? `"fondo-${id}"` : "nil";

  return `        Theme(
            id: "${id}",
            nombre: "${nombre(id)}",
            glass1: ${v["glass-1"]},
            glass2: ${v["glass-2"]},
            glass3: ${v["glass-3"]},
            borde: ${swiftColor(v.border)},
            bordeFuerte: ${swiftColor(v["border-strong"])},
            texto: ${swiftColor(v.text)},
            texto2: ${swiftColor(v["text-2"])},
            texto3: ${swiftColor(v["text-3"])},
            solido: ${swiftColor(v.ink)},
            sobreSolido: ${swiftColor(v["on-ink"])},
            luzA: ${swiftColor(v["bg-a"])},
            luzB: ${swiftColor(v["bg-b"])},
            luzC: ${swiftColor(v["bg-c"])},
            mancha1: ${swiftColor(v["blob-1"])},
            mancha2: ${swiftColor(v["blob-2"])},
            mancha3: ${swiftColor(v["blob-3"])},
            fondoInicio: ${p.inicio},
            fondoFin: ${p.fin},
            fondo: [
                ${paradas}
            ],
            obra: ${obra}
        )`;
});

function nombre(id) {
  return { noche: "Noche", plata: "Plata", brasa: "Brasa", electrico: "Eléctrico", pliegues: "Pliegues" }[id] || id;
}

const swift = `// GENERADO por ios/scripts/sync-theme.mjs — no editar a mano.
//
// Los colores salen de app/design2.css, que es la fuente de verdad de los dos
// clientes. Si cambia un tema en la web, correr:
//
//     node ios/scripts/sync-theme.mjs --css ../SiezaGym/app/design2.css
//
// Temas encontrados: ${TEMAS.join(", ")}

import SwiftUI

extension Color {
    init(r: Double, g: Double, b: Double, a: Double) {
        self.init(.sRGB, red: r / 255, green: g / 255, blue: b / 255, opacity: a)
    }
}

extension Theme {
    /// Los temas del diseño, en el mismo orden que el selector de la web.
    static let todos: [Theme] = [
${cuerpos.join(",\n")}
    ]
}
`;

writeFileSync(SALIDA, swift, "utf8");
console.log(`${TEMAS.length} temas -> ${SALIDA.replace(process.cwd() + "/", "")}`);
