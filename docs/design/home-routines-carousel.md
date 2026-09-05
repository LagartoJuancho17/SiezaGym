# Mazo de rutinas de la Home

## Orden

El mazo conserva el orden recibido desde la Home. Cada gesto o pulsación mueve exactamente la rutina frontal al final: `A → B → C → A`. La dirección del gesto cambia la dirección visual de salida, no el orden de la cola.

La transición de `transform` del contenedor frontal es la única señal visual que puede completar el movimiento. Los eventos de `opacity`, las transiciones de elementos hijos y el temporizador de respaldo no pueden avanzar el índice una segunda vez.

## Contenido

El mazo contiene únicamente rutinas propias o asignadas. La opción “Nueva rutina” no forma parte de la Home. La creación continúa disponible en `/rutinas`.

Con cero rutinas el bloque no se renderiza. Con una rutina se muestra la tarjeta sin gesto ni paginación porque no existe otra tarjeta a la cual avanzar.

## Evidencia

`tests/home-routines-carousel.test.js` comprueba el orden circular, el filtro del evento de transición y la ausencia de acciones de creación. La evaluación visual periódica está en `evals/home-routines-carousel.md`.
