import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { transformWithOxc } from "vite";

// Mismo alias que jsconfig.json, para poder importar modulos de la app en los
// tests en vez de leerlos como texto.
export default defineConfig({
  plugins: [{
    name: "design2-jsx-tests",
    enforce: "pre",
    async transform(code, id) {
      // Next acepta JSX en .js. Vite necesita reconocerlo antes de analizar
      // imports; su propio transformador evita añadir otra dependencia.
      if (!/\/(components|app)\/.*\.js$/.test(id) || id.includes("node_modules")) return;
      return transformWithOxc(code, id, { lang: "jsx", jsx: { runtime: "automatic" } });
    },
  }],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});
