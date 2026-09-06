import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Mismo alias que jsconfig.json, para poder importar modulos de la app en los
// tests en vez de leerlos como texto.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});
