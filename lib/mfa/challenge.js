/**
 * El desafío del segundo factor: generar el código, guardarlo hasheado y
 * decidir si el que llega es el correcto.
 *
 * Todo acá es puro: recibe la hora y devuelve un veredicto. No toca Firestore
 * ni manda mails. Así las reglas de vencimiento e intentos se prueban sin red y
 * sin esperar diez minutos.
 */
import { createHash, randomBytes, randomInt, scryptSync, timingSafeEqual } from "node:crypto";

/** Seis dígitos: los que se leen de un mail y se tipean sin equivocarse. */
export const LARGO_CODIGO = 6;

/** Diez minutos. Suficiente para ir a buscar el mail, corto para que no quede colgado. */
export const VIGENCIA_MS = 10 * 60 * 1000;

/**
 * Cinco intentos y se quema. Con 10^6 combinaciones y cinco tiros, adivinar
 * tiene 1 en 200.000: es lo que hace que un código corto alcance.
 */
export const INTENTOS_MAX = 5;

/**
 * Cuántas veces se puede arrancar el login por email en la ventana.
 *
 * Cuenta todos los intentos, no sólo los que terminan en mail mandado: es el
 * mismo número el que frena probar contraseñas de a miles y el que frena
 * llenarle la casilla a alguien. Ocho deja margen para equivocarse de
 * contraseña dos o tres veces y pedir el código de nuevo.
 */
export const PEDIDOS_MAX = 8;
export const VENTANA_MS = 15 * 60 * 1000;

/**
 * Un código de seis dígitos, con ceros a la izquierda si toca.
 *
 * `randomInt` y no `Math.random`: es el generador criptográfico del sistema y
 * además reparte uniforme, sin el sesgo que deja un `%` sobre un rango.
 */
export function generarCodigo() {
  return String(randomInt(0, 10 ** LARGO_CODIGO)).padStart(LARGO_CODIGO, "0");
}

/**
 * Hash del código para guardarlo.
 *
 * `scrypt` y no `sha256` a propósito: seis dígitos son veinte bits, y con un
 * hash rápido probar el millón de combinaciones es instantáneo. Esto es red de
 * seguridad por si el documento se filtra; lo que de verdad protege el código
 * es que vence y que se quema a los cinco intentos.
 */
export function hashear(codigo, sal) {
  return scryptSync(codigo, sal, 32).toString("hex");
}

export function nuevaSal() {
  return randomBytes(16).toString("hex");
}

/**
 * El id del desafío viaja al cliente, así que es un secreto más: si fuera
 * adivinable, cualquiera podría gastarle los intentos al desafío de otro.
 */
export function nuevoID() {
  return randomBytes(24).toString("base64url");
}

/**
 * Arma el desafío listo para guardar, junto con el código en claro, que es lo
 * único que sale por mail y no se guarda en ninguna parte.
 */
export function nuevoDesafio({ uid, email, modo, ahora = Date.now() }) {
  const codigo = generarCodigo();
  const sal = nuevaSal();

  return {
    id: nuevoID(),
    codigo,
    documento: {
      uid,
      email: normalizarEmail(email),
      modo,
      sal,
      codigoHash: hashear(codigo, sal),
      intentos: 0,
      creadoEn: ahora,
      venceEn: ahora + VIGENCIA_MS,
    },
  };
}

/** El email como clave: sin espacios y en minúsculas, o el límite se esquiva cambiando una mayúscula. */
export function normalizarEmail(email) {
  return String(email || "").trim().toLowerCase();
}

/** Clave de documento para el límite de pedidos: Firestore no acepta "/" ni "@" cómodos. */
export function claveThrottle(email) {
  return createHash("sha256").update(normalizarEmail(email)).digest("hex").slice(0, 40);
}

/**
 * Sólo dígitos: el usuario pega el código con espacios, guiones o el "Tu código
 * es 123456" entero, y eso no tiene que contar como intento fallido.
 */
export function limpiarCodigo(entrada) {
  return String(entrada ?? "").replace(/\D/g, "");
}

/**
 * ¿Es este el código?
 *
 * Devuelve el motivo y no un booleano porque cada caso se le dice distinto al
 * usuario: uno se reintenta, otro se pide de nuevo.
 */
export function revisar(documento, entrada, ahora = Date.now()) {
  if (!documento) return { ok: false, motivo: "inexistente" };
  if (documento.intentos >= INTENTOS_MAX) return { ok: false, motivo: "quemado" };
  if (ahora >= documento.venceEn) return { ok: false, motivo: "vencido" };

  const codigo = limpiarCodigo(entrada);
  if (codigo.length !== LARGO_CODIGO) {
    return { ok: false, motivo: "incompleto", intentos: documento.intentos };
  }

  if (!iguales(hashear(codigo, documento.sal), documento.codigoHash)) {
    const intentos = documento.intentos + 1;
    return {
      ok: false,
      motivo: intentos >= INTENTOS_MAX ? "quemado" : "incorrecto",
      intentos,
      restantes: Math.max(0, INTENTOS_MAX - intentos),
    };
  }

  return { ok: true, uid: documento.uid, modo: documento.modo };
}

/**
 * Comparación de largo constante. Dos hashes de scrypt siempre miden igual,
 * pero el chequeo de largo evita que `timingSafeEqual` tire excepción si algún
 * día el documento viene de otra versión.
 */
function iguales(a, b) {
  const uno = Buffer.from(String(a), "hex");
  const otro = Buffer.from(String(b ?? ""), "hex");
  if (uno.length !== otro.length || uno.length === 0) return false;
  return timingSafeEqual(uno, otro);
}

/**
 * ¿Puede pedir otro código?
 *
 * Sin esto el endpoint sirve para dos cosas feas: probar contraseñas a mansalva
 * y llenarle la casilla a cualquiera con sólo saberle el mail.
 */
export function revisarPedidos(registro, ahora = Date.now()) {
  const dentroDeLaVentana = registro && ahora - registro.desde < VENTANA_MS;

  if (!dentroDeLaVentana) {
    return { ok: true, registro: { desde: ahora, pedidos: 1 } };
  }

  if (registro.pedidos >= PEDIDOS_MAX) {
    return {
      ok: false,
      motivo: "demasiados",
      esperarMs: registro.desde + VENTANA_MS - ahora,
      registro,
    };
  }

  return { ok: true, registro: { desde: registro.desde, pedidos: registro.pedidos + 1 } };
}
