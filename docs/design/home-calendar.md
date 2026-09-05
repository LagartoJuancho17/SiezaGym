# Calendario de la pantalla principal

## Resultado esperado

El calendario semanal es el primer contenido de la pantalla principal. Queda debajo de la navegación fija en escritorio y antes del hero en el orden visual y del DOM.

## Contrato visual

- Superficie: `bg-surface` (`#E5E1E0`).
- Borde exterior: `#5A1215`, igual que los widgets de métricas.
- Radio exterior: `10px`, igual que los widgets de métricas.
- Sombra: `shadow-sm`.
- Día actual: fondo `bg-accent` (`#FF5733`), borde `#D94323` y texto borgoña oscuro.
- Días restantes: fondo hueso `#F4F1EC`, borde `#D0C8BE` y radio de `8px`.

## Comportamiento adaptable

Los siete días permanecen en una sola fila. El bloque usa los mismos márgenes laterales y ancho máximo de las métricas. En escritorio deja espacio superior para la navegación fija; en móvil comienza con 16 px de separación. Los controles anterior y siguiente mantienen un área táctil de 40 × 40 px.

## Evidencia

La prueba `tests/home-calendar.test.js` bloquea regresiones en el orden, la superficie visual y la estructura adaptable. La evaluación visual periódica está definida en `evals/home-calendar-layout.md`.
