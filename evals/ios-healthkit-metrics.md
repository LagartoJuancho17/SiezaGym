# Eval: métricas de Apple Salud en iOS

## Resultado observable

Con una cuenta autenticada y un iPhone que tenga datos de Salud del día actual,
Inicio muestra una tarjeta `Actividad de hoy` con calorías activas, pasos y
distancia caminando/corriendo.

## Flujo manual

1. Instalar la app en un iPhone real con Apple Salud configurado.
2. En Inicio tocar `Conectar`.
3. Aceptar la lectura de actividad en el diálogo de Apple.
4. Confirmar que la tarjeta muestra los tres valores del día.
5. Volver a Salud, cambiar el estado o agregar actividad, cerrar y abrir la app.
6. Confirmar que los valores se actualizan al volver a primer plano.

## Casos negativos

- En el simulador o en un dispositivo sin HealthKit se muestra que Apple Salud no
  está disponible.
- Si el usuario no concede acceso, la app no escribe ningún dato y muestra que
  hay que revisar los permisos en Ajustes > Salud > Apps > SiezaGym.
- Sin actividad del día, la tarjeta muestra ceros y no reutiliza datos de días
  anteriores.
