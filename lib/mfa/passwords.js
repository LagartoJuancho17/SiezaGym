/**
 * Comprobar email + contraseña del lado del servidor.
 *
 * El Admin SDK no sabe verificar contraseñas: sólo las escribe. La única forma
 * de preguntarle a Firebase "¿esta contraseña es la de este mail?" sin crear una
 * sesión en el cliente es la API REST de Identity Toolkit, que es la misma que
 * usa el SDK del navegador por debajo.
 *
 * `returnSecureToken: false` importa: no queremos el token acá. Identity
 * Toolkit lo acepta igual (verificado contra el proyecto real: `verificarPassword`
 * sigue devolviendo `localId` con la contraseña correcta) y así el servidor
 * nunca llega a tener en una variable un ID token de Firebase utilizable,
 * defensa de más por si el día de mañana algo lo loguea o lo reenvía por
 * error. El token de sesión de verdad se emite después, en `/api/mfa/verify`,
 * y sólo si el código del mail es correcto.
 */

const URL_LOGIN =
  "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword";

export function claveWeb() {
  return process.env.FIREBASE_WEB_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
}

/**
 * @returns {Promise<{ok: true, uid: string} | {ok: false, motivo: string}>}
 */
export async function verificarPassword(email, password) {
  const key = claveWeb();
  if (!key) return { ok: false, motivo: "sin-configurar" };

  const respuesta = await fetch(`${URL_LOGIN}?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: false }),
  });

  const datos = await respuesta.json().catch(() => ({}));

  if (respuesta.ok && datos.localId) {
    return { ok: true, uid: datos.localId };
  }

  return { ok: false, motivo: traducir(datos?.error?.message) };
}

/**
 * Los proyectos con protección de enumeración de mails devuelven
 * `INVALID_LOGIN_CREDENTIALS` tanto si el mail no existe como si la contraseña
 * está mal, justamente para no delatar qué mails están registrados. Se respeta:
 * los dos casos salen como "credenciales".
 */
function traducir(codigo = "") {
  const limpio = String(codigo).split(" : ")[0];

  switch (limpio) {
    case "EMAIL_NOT_FOUND":
    case "INVALID_PASSWORD":
    case "INVALID_LOGIN_CREDENTIALS":
    case "MISSING_PASSWORD":
      return "credenciales";
    case "USER_DISABLED":
      return "deshabilitado";
    case "TOO_MANY_ATTEMPTS_TRY_LATER":
      return "demasiados";
    case "INVALID_EMAIL":
      return "email";
    default:
      return "desconocido";
  }
}
