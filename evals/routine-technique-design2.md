# Técnica y series falladas

Resultado: mantener las capacidades de main en el detalle minimalista.

Prueba automática: `npx vitest run tests/routine-technique-design2.test.js tests/routines-workout.test.js tests/rutina-detalle-design2.test.js`. Umbral: todos los casos pasan.

Evaluación visual, plata/noche y ancho 320/390 px:

1. Abrir ejercicio, expandir «Ver técnica» usando teclado; descripción, nota y animación deben ser legibles. Probar antes y durante el entrenamiento.
2. Ejercicio sin descripción: mensaje explícito, sin texto inventado.
3. Rutina propia, marcar una serie fallada y hecha: aparece «Fallada», no suma volumen; finalizar y comprobar etiqueta en historial y exclusión del récord.
4. Desmarcar fallada antes de terminar: vuelve a aportar su volumen y se guarda sin fallo.
5. Rutina asignada: conserva carga de series y no muestra control de fallo, como main.

Umbral: cinco escenarios aprobados sin desbordamiento horizontal ni datos ficticios.

Regresión codificada: una migración visual no puede quitar acceso a técnica ni transformar un fallo en una serie exitosa. La prueba del payload y del volumen impide repetir esa pérdida.
