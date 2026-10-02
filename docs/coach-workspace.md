# Panel del entrenador

La web del entrenador usa la identidad SIEZA (Negro `#0B0C0E`, Grafito `#1A1D22`, Blanco `#F4F5F7` y Brasa `#FF5733`) y adapta a escritorio la navegación de la app. No modifica la experiencia del alumno ni las demás preferencias visuales.

## Tareas principales

1. **Resumen:** ver alumnos vinculados, planes asignados y alumnos que completaron al menos un plan.
2. **Alumnos:** buscar por nombre o correo, abrir seguimiento, invitar con el flujo existente.
3. **Actividad:** revisar la última finalización registrada de cada plan asignado y abrir el alumno.
4. **Rutinas:** acceder al constructor y las rutinas existentes.

Las cifras se calculan en `lib/coach/dashboardSummary.js` usando solo alumnos actualmente vinculados. “Actividad reciente” no pretende ser un historial completo: el documento de una asignación conserva su última finalización. El historial completo sigue en el detalle de cada alumno.

## Estados y movimiento

- `loading.js` muestra la estructura del panel mientras se carga la ruta; `error.js` permite reintentar.
- La cobertura de planes se revela una sola vez. Botones y navegación tienen feedback breve.
- `prefers-reduced-motion` elimina desplazamientos y barridos sin quitar información.
- En pantalla angosta, la navegación lateral pasa a una fila horizontal y el contenido se apila.

## Verificación

Ejecutar `npm test -- --run tests/coach-dashboard-summary.test.js tests/coach-dashboard-ux.eval.test.js tests/coach-design2.test.js`, `npm run lint` y `npm run build`. En navegador comprobar `/dashboard/coach` y un detalle de alumno con datos reales, búsqueda sin resultados, invitación, teclado, móvil y reducción de movimiento.
# Acceso administrativo

El acceso a `/admin` acepta el correo de la lista permitida o `isAdmin: true` en
el perfil de Firestore de la misma UID autenticada. El perfil se lee del servidor;
el cliente no puede modificar `isAdmin` según `firestore.rules`. El rol también
habilita el espacio del entrenador. Para verificar la cuenta, consultar su perfil
y abrir `/admin` y `/dashboard/coach` con esa sesión.

En la web de escritorio, `/` lleva a entrenadores y admins directamente a
`/dashboard/coach`. La Home de atleta sigue siendo la portada en móvil y para
cuentas normales. Un entrenador puede abrirla expresamente en `/?view=athlete`.
