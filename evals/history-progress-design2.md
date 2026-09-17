# Historial y progreso: evaluación design2

Resultado esperado: recorrer historial, detalle de sesión y progreso de cada ejercicio con el mismo vidrio, tipografía y navegación de design2, conservando datos privados y enlaces.

Suite determinista: `npx vitest run tests/history-progress-design2.test.js`.
Umbral: todos los casos deben pasar. Cubre autenticación, aislamiento del detalle por usuario, datos reales, acceso a ejercicios personalizados, exclusión de series falladas de récords, cronología del gráfico y estimaciones explícitas.

Evaluación visual con sesión real en desarrollo, en 320, 390 y 1280 px y temas plata/noche:

1. Historial vacío: mensaje y enlace a rutinas. Historial poblado: nombre, fecha, duración, series y volumen coinciden con la sesión.
2. Abrir sesión desde historial y volver: conserva acceso a tabs; nombre largo se adapta sin perder contenido; las series falladas tienen etiqueta textual.
3. Sesión con ejercicio personalizado: muestra su nombre y abre su progreso. Una sesión ajena devuelve 404.
4. Progreso con cero o una sesión: estado de espera sin gráfico inventado. Con varias sesiones: curva cronológica, tabla en orden reciente, peso máximo y 1RM estimado separados.
5. Cambiar tema: curva, tooltip, filas, texto y tarjetas responden al tema; ningún borde de la paleta anterior.
6. Teclado: enlaces enfocados visibles, navegación de vuelta disponible. A 320 px no hay desplazamiento horizontal.

Umbral visual: seis escenarios aprobados, cero pérdida de funciones o datos. No requiere inferencia pagada: la lógica es determinista; la inspección visual evalúa presentación.
