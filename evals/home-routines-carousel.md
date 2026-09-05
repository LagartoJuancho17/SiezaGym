# Evaluación visual: mazo de rutinas

## Preparación

Abrir `/` con una cuenta autenticada que tenga tres rutinas visibles llamadas A, B y C. Evaluar una vez en 390 × 844 px y otra en 1440 × 900 px.

## Criterios

Calificar cada criterio con `1` si se cumple por completo o `0` si existe cualquier incumplimiento:

1. La primera tarjeta es A y un solo gesto muestra B, nunca C.
2. Tres movimientos consecutivos producen `A → B → C → A` sin parpadeos ni cambios dobles.
3. Pulsaciones rápidas durante la animación no alteran el orden ni saltan tarjetas.
4. El mazo y su paginación incluyen exactamente tres tarjetas; no aparece “Nueva rutina” ni “Crear rutina”.
5. Con una sola rutina no aparecen controles de navegación y la tarjeta sigue abriendo su detalle.

## Umbral

La evaluación aprueba únicamente con `5/5` y sin errores de consola. Registrar la secuencia observada en cada tamaño.
