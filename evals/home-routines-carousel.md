# Evaluación visual: mazo de rutinas

## Preparación

Abrir `/` con una cuenta autenticada que tenga tres rutinas visibles llamadas A, B y C. Evaluar una vez en 390 × 844 px y otra en 1440 × 900 px.

## Criterios

Calificar cada criterio con `1` si se cumple por completo o `0` si existe cualquier incumplimiento:

1. La primera tarjeta es A y un solo gesto muestra B, nunca C.
2. Tres movimientos consecutivos producen `A → B → C → A` sin parpadeos ni cambios dobles.
3. La tarjeta siguiente se expande hacia el frente y cambia claramente de un tono claro desaturado al rojo principal, sin destellos ni saltos de color.
4. Pulsaciones rápidas durante la animación no alteran el orden ni saltan tarjetas.
5. El mazo y su paginación incluyen exactamente tres tarjetas; no aparece “Nueva rutina” ni “Crear rutina”.
6. Con una sola rutina no aparecen controles de navegación y la tarjeta sigue abriendo su detalle.
7. Con reducción de movimiento activa no hay desplazamiento animado, pero el cambio de color sigue comunicando qué tarjeta pasa al frente.

## Umbral

La evaluación aprueba únicamente con `7/7` y sin errores de consola. Registrar la secuencia observada en cada tamaño.
