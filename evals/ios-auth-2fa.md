# Eval: login de iOS con segundo factor por mail

## Resultado medible

El flujo oficial de la app pide un código de correo después de la contraseña.
La protección real debe resistir también un cliente modificado que llame
directamente a Firebase, no sólo el formulario que nosotros dibujamos.

## Frontera de seguridad que falta cerrar

Esta es la parte que hay que poder defender. El orden de las llamadas es lo que
hace la diferencia:

1. `POST /api/mfa/start` recibe email y contraseña. El servidor las comprueba
   contra Identity Toolkit y manda el código. **No devuelve ningún token.**
2. `POST /api/mfa/verify` recibe el código. Recién si es correcto el servidor
   emite un custom token, y la app lo cambia por una sesión de Firebase.

La app oficial ya no llama a `signIn(withEmail:password:)`, pero eso **no
impide** que alguien lo llame con otro cliente o desde la web. Firebase sigue
emitiendo sesiones de email/contraseña directamente y las reglas actuales
aceptan cualquier `request.auth != null`. Por eso este trabajo no se considera
2FA exigible hasta que el backend y Firestore rechacen los tokens de password
que no acrediten una verificación de código para esa sesión.

Eval adversarial obligatorio antes de publicar: iniciar sesión directamente
con email/contraseña mediante la API pública de Firebase. Sin código, esa
sesión no debe poder leer ni escribir datos de Firestore ni crear una cookie
de sesión web. El flujo normal con código sí debe poder hacerlo. La protección
no debe basarse en una claim permanente del usuario, porque una sesión futura
con sólo contraseña la heredaría.

- Con la contraseña correcta y sin código, la respuesta de `start` no contiene
  la palabra "token" en ninguna parte.
- El hash del código y el contador de intentos viven en `mfaChallenges`, que en
  `firestore.rules` está cerrada a `read, write: if false`. Esto protege el
  desafío, pero **no sustituye** el control de acceso a las demás colecciones.
- Un `desafio` inventado da 404: el id es aleatorio de 24 bytes, no una cuenta.

## El código

- Seis dígitos. Vence a los 10 minutos.
- Cinco intentos y se quema. El último fallido dice "quemado", no "te quedan 0".
- Un código correcto sirve **una sola vez**: se verifica y borra dentro de la
  misma transacción, incluso ante dos pedidos concurrentes.
- Pegar `Tu código es 123456.` funciona: se queda con los dígitos.
- Un código de menos de seis dígitos **no gasta intento**.
- Restar dígitos que no son 0-9 (por ejemplo índicos) se descarta igual que en
  el servidor, que filtra con `\D`.

## Límite de pedidos

- Ocho arranques por email cada quince minutos, contando también los que fallan
  por contraseña. Con eso el endpoint no sirve para probar contraseñas de a
  miles ni para llenarle la casilla a nadie.
- El turno se pide **antes** de comprobar la contraseña. Si fuera al revés, el
  límite no protegería nada.
- La ventana es fija y no corrediza: a los quince minutos el contador vuelve a
  cero. Con una ventana corrediza, alguien bloqueado que sigue intentando queda
  bloqueado para siempre.
- El contador está en una transacción: doce pedidos simultáneos dejan pasar
  ocho, no doce.

## Crear la cuenta

- La cuenta la crea el servidor con el Admin SDK, que no emite sesión. Existe
  pero no se puede usar hasta que llegue el código.
- Un email ya registrado devuelve "Ya hay una cuenta con ese email."
- Si abandonás en la pantalla del código, la cuenta queda creada. Se recupera
  entrando por "Iniciar sesión", que manda un código nuevo.

## La pantalla, igual que la web

- Dos pestañas arriba, **"Iniciar sesión"** y **"Crear cuenta"**, en vez del
  "No tengo cuenta" de antes.
- Los títulos son los mismos: "Bienvenido de nuevo" y "Creá tu cuenta".
- Crear cuenta pide **"Repetir contraseña"**. Con las dos distintas aparece
  "Las dos contraseñas no coinciden." y el botón queda apagado.
- El aviso no salta con la primera letra: espera a que haya algo escrito en el
  segundo campo.
- "Mostrar / Ocultar" es texto y no un ojo: dice lo que hace y anuncia el
  estado sin depender de reconocer el icono.
- Cambiar de pestaña borra las contraseñas y **deja el email**.
- El botón de Google va a todo lo ancho, con la misma altura y forma que el
  botón principal, y el logo oficial sin recolorear. Antes era el botón del SDK,
  que se plantaba en su ancho y traía su fondo blanco.

## Google no pide código

A propósito: Google es un proveedor de identidad distinto y queda como la
puerta que funciona si el servidor de mails se cae. No asumimos que cada
cuenta de Google tenga configurado segundo factor.

## Lo que hay que tener configurado

- `RESEND_API_KEY` y `RESEND_FROM` con dominio verificado en Vercel. Sin ambos,
  en producción `/api/mfa/start` devuelve 503 antes de crear una cuenta.
- `curl https://sieza-gym.vercel.app/api/mfa/start` responde `{"listo": true}`
  cuando el deploy puede mandar mails.
- En desarrollo sin clave, el código sale por el log del servidor y la pantalla
  lo avisa con un martillo. Eso **no** pasa en producción.
