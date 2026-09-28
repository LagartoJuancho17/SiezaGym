import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../app/design2.css", import.meta.url), "utf8");
const start = css.indexOf('.d2[data-d2-theme="sieza"]');
const block = css.slice(start, css.indexOf("\n}", start));

function hex(token) {
  const value = block.match(new RegExp(`--d2-${token}:\\s*(#[0-9a-f]{6});`, "i"))?.[1];
  if (!value) throw new Error(`Falta color ${token}`);
  return [1, 3, 5].map((index) => parseInt(value.slice(index, index + 2), 16) / 255);
}

function luminance(rgb) {
  return rgb.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
    .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
}

function contrast(foreground, background) {
  const values = [luminance(hex(foreground)), luminance(hex(background))].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

describe("Evaluación de legibilidad del tema SIEZA", () => {
  it.each([
    ["texto sobre fondo", "text", "ground"],
    ["texto sobre tarjeta", "text", "surface-1"],
    ["texto auxiliar sobre fondo", "text-3", "ground"],
    ["texto auxiliar sobre tarjeta", "text-3", "surface-1"],
    ["botón Brasa", "on-ink", "ink"],
  ])("%s supera WCAG AA para texto normal", (_label, foreground, background) => {
    expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });
});
