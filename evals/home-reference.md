# Evaluación: Home de vidrio plata

## Resultado medible

Reproducir la composición de la segunda imagen de referencia: fondo gris plata, vidrio translúcido, dos tarjetas completas y parte de la tercera, dos actividades visibles y una barra flotante con cuatro destinos. Se mantienen el idioma español, las métricas de gimnasio y los enlaces de SiezaGym.

## Preparación reproducible

```sh
npm test
D2_PREVIEW=true npm run dev -- --webpack --port 3022
```

Abrir `http://localhost:3022/design-preview`. Esta ruta usa los mismos componentes y estilos que la Home; solo sustituye sus datos por `evals/fixtures/home-reference.js`. El retrato de la referencia no se inventa: la cuenta sin foto usa su inicial. Los datos adicionales del fixture son sintéticos y sirven únicamente para probar búsqueda y textos largos.

Para inspeccionar desde un navegador de escritorio con un área móvil real, abrir `/design-preview?viewport=390`. El marco de evaluación ofrece anchos `320`, `390` y `430` con alturas `694`, `844` y `932`, y enlaces para cambiar de escenario. El iframe no dibuja barras de estado ficticias y no cambia los componentes de la aplicación.

Evaluar las tres vistas:

- `/design-preview`: estado de la captura y doce sesiones disponibles para buscar.
- `/design-preview?scenario=empty`: cuenta sin actividad y creación de la primera rutina.
- `/design-preview?scenario=long`: titular, saludo y nombre de sesión extensos.

Usar un área de contenido móvil de 390 × 844 y 434 × 942 CSS px; repetir al menos en 360 × 800 y escritorio 1440 × 900. La segunda referencia incluye marco exterior de teléfono y barra del sistema: comparar el contenido de la aplicación con el área interior del teléfono, sin exigir que la web dibuje esos elementos del dispositivo. Guardar una captura por tamaño y escenario evaluado.

## Criterios y umbral

Calificar cada criterio `1` si se cumple completamente o `0` si falla. Aprobación: `10/10`, ninguna excepción de la aplicación y ningún enlace sustituido por `#`.

| # | Comprobación | Evidencia |
| --- | --- | --- |
| 1 | El primer render y la pantalla estable usan plata, con centro del fondo más oscuro y bordes claros. Nunca aparece el tema negro previo. | Captura al cargar y después de hidratar. |
| 2 | Búsqueda, tarjetas y actividades muestran bordes de luz suaves, transparencia y fondo difuminado; no sombras negras duras. | Comparación visual con imagen 2. |
| 3 | Saludo arriba, titular en dos líneas con segunda línea itálica, botón negro a la derecha, buscador debajo. La escala puede quedar hasta un 6 % por debajo de la referencia en móviles pequeños, sin perder la jerarquía. | Captura completa, sin solapamientos. |
| 4 | En la vista móvil se ven dos objetivos completos y una parte del tercero; el carrusel permite acceder a los cuatro. | Captura inicial y después de desplazar. |
| 5 | Se ven dos actividades por defecto, sin quedar ocultas detrás de la barra inferior en la vista móvil de referencia. | Captura inicial. |
| 6 | La barra es una cápsula única de vidrio con Inicio activo en negro y disco blanco, seguida de Progreso, Rutinas y Perfil. Cada destino abre su ruta. | Captura y verificación de destinos. |
| 7 | Escribir `TRACCION` encuentra `Tracción y bíceps`, que está después de las dos sesiones iniciales. `entrenamiento de prueba` devuelve nueve resultados. Vaciar la búsqueda vuelve a dos. | Secuencia de interacción y cantidad de filas. |
| 8 | Escribir `natación` muestra el mensaje de búsqueda sin resultados. El escenario vacío muestra el mensaje de cuenta sin entrenamientos y enlaza a crear una rutina. | Capturas de ambos mensajes y enlace del titular. |
| 9 | El escenario de textos largos permanece dentro del ancho del móvil; el titular puede aumentar la altura y la página permite desplazarse hasta el final. No hay recorte horizontal del cuerpo. | Captura y desplazamiento completo a 360 px. |
| 10 | Los controles se alcanzan por teclado, tienen foco visible y etiqueta; al activar reducción de movimiento no se pierde información ni navegación. El selector de tema está ausente salvo activación explícita. | Recorrido por teclado y preferencia de movimiento reducido. |

### Migración del tema

En una sesión de evaluación guardar `d2-theme=noche` en el almacenamiento local, retirar `d2-theme-v2` si existía y recargar. La pantalla debe permanecer plata. La clave anterior se ignora. Para probar el selector de diseño, iniciar otro servidor de desarrollo con `NEXT_PUBLIC_D2_THEME_SWITCHER=true`; no debe aparecer por el solo hecho de estar en desarrollo y permanece oculto en producción.

### Límites de la vista aislada

Los enlaces del fixture conservan la estructura de producción y algunos contienen identificadores ficticios; no demuestran que exista esa rutina en Firebase. Verificar el acceso al detalle con una cuenta real y sus sesiones antes de publicar. La ruta de evaluación responde 404 en producción y cuando falta `D2_PREVIEW=true`.

## Registro de una ejecución

Registrar fecha, revisión Git, tamaños probados, navegador, puntuación `n/10`, rutas de capturas y cualquier diferencia pendiente. La aprobación automática de las pruebas de HTML no sustituye esta evaluación visual ni permite afirmar coincidencia de píxeles sin comparar capturas.
