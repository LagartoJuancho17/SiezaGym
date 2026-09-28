/**
 * Paso 1 del segundo factor: comprobar la contraseña y mandar el código.
 *
 * Este endpoint no devuelve tokens al cliente. Identity Toolkit sí emite un
 * token al verificar la contraseña en el servidor; se descarta ahí. La sesión
 * del flujo oficial se emite en `/api/mfa/verify` tras comprobar el código.
 * La aplicación de 2FA en el backend exige además bloquear sesiones directas
 * de password sin código en las reglas y en la cookie web.
 */
import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { nuevoDesafio, normalizarEmail, VIGENCIA_MS } from "@/lib/mfa/challenge";
import { hayCorreoConfigurado, mandarCodigo, permiteConsola } from "@/lib/mfa/mailer";
import { verificarPassword } from "@/lib/mfa/passwords";
import { borrarDesafio, guardarDesafio, pedirTurno } from "@/lib/mfa/store";

const MINUTOS = Math.round(VIGENCIA_MS / 60000);

export async function POST(request) {
  const cuerpo = await request.json().catch(() => ({}));
  const email = normalizarEmail(cuerpo.email);
  const password = String(cuerpo.password || "");
  const modo = cuerpo.modo === "signup" ? "signup" : "signin";
  const nombre = String(cuerpo.displayName || "").trim();

  if (!email.includes("@") || password.length < 6) {
    return error(400, "datos", "Revisá el email y la contraseña.");
  }

  // No crear una cuenta ni gastar intentos si sabemos que el deploy no puede
  // entregar códigos. La cuenta creada sin correo quedaría inutilizable.
  if (!hayCorreoConfigurado() && !permiteConsola()) {
    return error(503, "sin-correo", "El acceso por email no está disponible ahora. Probá más tarde o usá Google si tu cuenta está vinculada.");
  }

  // El turno se pide antes de tocar la contraseña: si no, este endpoint sirve
  // para probar contraseñas de a miles contra Firebase.
  const turno = await pedirTurno(email);
  if (!turno.ok) {
    const minutos = Math.max(1, Math.ceil(turno.esperarMs / 60000));
    return error(429, "demasiados", `Demasiados intentos. Probá en ${minutos} minutos.`);
  }

  const uid = modo === "signup"
    ? await crearCuenta({ email, password, nombre })
    : await comprobarCuenta({ email, password });

  if (uid.error) return uid.error;

  const { id, codigo, documento } = nuevoDesafio({ uid: uid.valor, email, modo });
  await guardarDesafio(id, documento);

  const correo = await mandarCodigo({ email, codigo, minutos: MINUTOS });
  if (!correo.ok) {
    await borrarDesafio(id);
    // Falta la clave de Resend en el deploy: no es un problema del usuario y no
    // se arregla reintentando, así que se lo manda a la puerta que sí funciona.
    if (correo.motivo === "sin-correo") {
      return error(503, "sin-correo", "El acceso por email no está disponible ahora. Probá más tarde o usá Google si tu cuenta está vinculada.");
    }
    if (modo === "signup") {
      return error(502, "correo", "La cuenta se creó, pero el código no salió. Pasá a Iniciar sesión para pedir uno nuevo.");
    }
    return error(502, "correo", "No pudimos mandar el mail con el código. Probá de nuevo.");
  }

  return NextResponse.json({
    desafio: id,
    venceEnSegundos: Math.round(VIGENCIA_MS / 1000),
    // Sólo en desarrollo sin clave de correo: le dice a la app que el código
    // salió por el log del servidor y no por mail.
    transporte: correo.transporte === "consola" ? "consola" : undefined,
  });
}

/**
 * El Admin SDK crea el usuario sin emitir sesión al cliente. Las reglas de
 * acceso deben impedir que otro cliente use el password antes del código.
 */
async function crearCuenta({ email, password, nombre }) {
  try {
    const usuario = await getAdminAuth().createUser({
      email,
      password,
      displayName: nombre || undefined,
    });
    return { valor: usuario.uid };
  } catch (fallo) {
    if (fallo.code === "auth/email-already-exists") {
      return { error: error(409, "existe", "Ya hay una cuenta con ese email.") };
    }
    if (fallo.code === "auth/invalid-password") {
      return { error: error(400, "password", "La contraseña necesita al menos 6 caracteres.") };
    }
    if (fallo.code === "auth/invalid-email") {
      return { error: error(400, "email", "Ese email no es válido.") };
    }
    console.error("[mfa/start] no se pudo crear la cuenta:", fallo);
    return { error: error(500, "desconocido", "No pudimos crear la cuenta.") };
  }
}

async function comprobarCuenta({ email, password }) {
  const veredicto = await verificarPassword(email, password);
  if (veredicto.ok) return { valor: veredicto.uid };

  switch (veredicto.motivo) {
    case "credenciales":
      return { error: error(401, "credenciales", "Email o contraseña incorrectos.") };
    case "deshabilitado":
      return { error: error(403, "deshabilitado", "Esa cuenta está deshabilitada.") };
    case "demasiados":
      return { error: error(429, "demasiados", "Demasiados intentos. Esperá un momento.") };
    case "email":
      return { error: error(400, "email", "Ese email no es válido.") };
    case "sin-configurar":
      console.error("[mfa/start] falta NEXT_PUBLIC_FIREBASE_API_KEY en el servidor");
      return { error: error(500, "desconocido", "El servidor no está configurado.") };
    default:
      return { error: error(500, "desconocido", "Algo salió mal. Probá de nuevo.") };
  }
}

/**
 * Diagnóstico del deploy: `curl https://sieza-gym.vercel.app/api/mfa/start`.
 *
 * `listo: false` significa que el login por email no funciona en ese deploy.
 */
export async function GET() {
  const conClave = hayCorreoConfigurado();
  return NextResponse.json({
    correo: conClave ? "resend" : permiteConsola() ? "consola" : "ninguno",
    listo: conClave || permiteConsola(),
  });
}

function error(estado, motivo, mensaje) {
  return NextResponse.json({ motivo, mensaje }, { status: estado });
}
