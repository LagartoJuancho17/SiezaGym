/**
 * Dónde viven los desafíos del segundo factor.
 *
 * `mfaChallenges` y `mfaThrottle` están cerradas a cal y canto en
 * `firestore.rules`: nadie las lee ni las escribe desde el cliente. Sólo el
 * Admin SDK entra acá, que es el que saltea las reglas.
 */
import { getDb } from "@/lib/firebase/firestore";
import { claveThrottle, revisar, revisarPedidos } from "@/lib/mfa/challenge";

const DESAFIOS = "mfaChallenges";
const PEDIDOS = "mfaThrottle";

export async function guardarDesafio(id, documento) {
  await getDb().collection(DESAFIOS).doc(id).set(documento);
}

/** Borra un desafío que no se pudo entregar por correo. */
export async function borrarDesafio(id) {
  await getDb().collection(DESAFIOS).doc(id).delete();
}

/**
 * Leer, contar intentos y consumir el código es una sola transacción.
 * Dos verificaciones concurrentes no pueden emitir dos sesiones con el
 * mismo código ni pisarse el contador de intentos.
 */
export async function consumirDesafio(id, codigo, ahora = Date.now()) {
  if (!id) return { ok: false, motivo: "inexistente" };
  const ref = getDb().collection(DESAFIOS).doc(id);

  return getDb().runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    const veredicto = revisar(doc.exists ? doc.data() : null, codigo, ahora);

    if (veredicto.ok || veredicto.motivo === "quemado" || veredicto.motivo === "vencido") {
      if (doc.exists) tx.delete(ref);
    } else if (veredicto.motivo === "incorrecto") {
      tx.update(ref, { intentos: veredicto.intentos });
    }

    return veredicto;
  });
}

/**
 * Suma un intento para ese email y dice si puede seguir.
 *
 * Va en transacción porque dos pedidos a la vez leerían el mismo contador y
 * escribirían el mismo número, y el límite se esquivaría mandando todo junto.
 */
export async function pedirTurno(email, ahora = Date.now()) {
  const ref = getDb().collection(PEDIDOS).doc(claveThrottle(email));

  return getDb().runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    const veredicto = revisarPedidos(doc.exists ? doc.data() : null, ahora);

    if (veredicto.ok) tx.set(ref, veredicto.registro);
    return veredicto;
  });
}
