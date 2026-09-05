# Mazo de rutinas de la Home

## Orden

El mazo conserva el orden recibido desde la Home. Cada gesto o pulsación mueve exactamente la rutina frontal al final: `A → B → C → A`. La dirección del gesto cambia la dirección visual de salida, no el orden de la cola.

Solo las transiciones propias de `transform` u `opacity` del contenedor frontal pueden completar el movimiento. Las transiciones de elementos hijos y el temporizador de respaldo no pueden avanzar el índice una segunda vez.

## Animación de promoción

La tarjeta siguiente se expande desde el fondo mientras una capa clara desaturada desaparece para revelar el gradiente rojo principal. La transición usa únicamente `transform` y `opacity`, dura 260 ms y evita repintados de color cuadro a cuadro. La salida usa una curva `ease-out` fuerte y la promoción una curva `ease-in-out` fuerte.

Con `prefers-reduced-motion`, el desplazamiento deja de animarse y se conserva una transición de opacidad de 150 ms para comunicar el cambio de estado sin movimiento espacial.

## Contenido

El mazo contiene únicamente rutinas propias o asignadas. La opción “Nueva rutina” no forma parte de la Home. La creación continúa disponible en `/rutinas`.

Con cero rutinas el bloque no se renderiza. Con una rutina se muestra la tarjeta sin gesto ni paginación porque no existe otra tarjeta a la cual avanzar.

## Evidencia

`tests/home-routines-carousel.test.js` comprueba el orden circular, el filtro del evento de transición, la progresión de color y la ausencia de acciones de creación. La evaluación visual periódica está en `evals/home-routines-carousel.md`.
