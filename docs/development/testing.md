# Pruebas de componentes

`npm test` ejecuta las pruebas locales determinísticas, sin acceso a Firebase ni llamadas a modelos.

La lógica de búsqueda vive en `lib/home/activity-search.js` y se prueba con entradas reales de texto, tildes, espacios y listas de hasta doce sesiones. No debe truncarse la lista antes de buscar.

`vitest.config.mjs` usa el transformador Oxc que ya incluye Vite para reconocer JSX en los `.js` de `components/design2` y en la ruta local `app/design-preview`. Las pruebas renderizan los componentes de producción con `react-dom/server`. Solo se sustituyen las integraciones de Next (`Link`, `Image`, navegación), sin conexiones externas. La instrumentación de `useSyncExternalStore` conserva el hook real y permite verificar además la lectura de almacenamiento y la limpieza de suscripciones.

`tests/home-reference-render.test.js` comprueba los enlaces, datos, estado vacío, dos sesiones iniciales, cuatro destinos, tema inicial plata, migración de la preferencia antigua y bloqueo de la vista de evaluación fuera de desarrollo. El renderizado de servidor no comprueba eventos, colores calculados, tipografía ni tamaños; esos comportamientos forman parte de `evals/home-reference.md`.

La vista `/design-preview` utiliza fixtures aislados y requiere `D2_PREVIEW=true` junto con `NODE_ENV=development`. En ese modo, `http://localhost:3000/` se reescribe internamente a la vista de 390 × 844 px, así la URL queda limpia. En producción responde 404 incluso si quedó configurada esa variable. Los datos sintéticos nunca deben importarse en la Home autenticada.
