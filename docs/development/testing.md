# Pruebas de componentes

Vitest no transforma JSX dentro de archivos `.js` con la configuración actual. Las pruebas no deben importar directamente componentes Next.js de ese tipo.

La lógica determinística de una interacción debe vivir en un módulo puro bajo `lib/` y probarse desde allí. Las pruebas de composición pueden leer el componente como contrato estático; el comportamiento completo se confirma mediante la evaluación visual correspondiente.
