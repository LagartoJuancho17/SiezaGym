# Evaluación visual: detalle de una rutina y entrenamiento

## Preparación

Abrir `/rutinas/<id>` con una sesión autenticada y capturar la pantalla completa en 390 × 844 px y 1440 × 900 px, en los tres temas (`noche`, `plata`, `brasa`). Usar una rutina con al menos tres ejercicios, uno de ellos prescrito serie por serie (una rampa del tipo 10 · 12 · 14 · 16) y otro de tiempo (plancha o similar).

Repetir la captura en tres estados: en reposo, con un ejercicio desplegado y con el entrenamiento en curso y alguna serie confirmada.

## Criterios

Calificar cada criterio con `1` si se cumple por completo o `0` si existe cualquier incumplimiento:

1. Los tres números del encabezado (ejercicios, series, minutos) coinciden con lo que muestra la lista de ejercicios, y el tiempo está rotulado como estimado.
2. Un ejercicio desplegado muestra una fila por serie: con la rampa se ven los cuatro valores distintos, y no un promedio ni un "4 × 10".
3. El ejercicio de tiempo pide segundos y no repeticiones, y no muestra una columna de kilos.
4. Un valor que la rutina no prescribió se ve como raya y nunca como cero.
5. El botón de comenzar entrenamiento queda siempre visible sin tapar el último ejercicio ni la barra de pestañas.
6. Entrenando: el cronómetro avanza, la pausa lo congela y al reanudar no salta hacia adelante.
7. Entrenando: la serie confirmada usa el sólido del tema y se distingue de una sin confirmar en los tres temas, incluidos los de sólido claro.
8. El volumen y el contador de series del pie solo suman series confirmadas; con la planilla recién abierta ambos están en cero.
9. Entrenando hay un botón `Volver` visible arriba; sin series sale directo y
   con series pide confirmación antes de descartar. No se ve la barra de pestañas.
10. La atribución "© Gym visual" aparece siempre que haya alguna animación en pantalla.

## Umbral

La evaluación aprueba únicamente con `10/10` y sin errores de consola. Adjuntar las capturas de los tres estados y anotar cualquier número que no se pueda rastrear hasta Firestore.
