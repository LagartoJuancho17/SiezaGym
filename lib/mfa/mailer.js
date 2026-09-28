/**
 * El mail con el código.
 *
 * Resend por `fetch` y sin SDK: es una sola llamada HTTP y agregar una
 * dependencia para eso no paga.
 *
 * Sin `RESEND_API_KEY` el código va al log del servidor en vez de al mail. Eso
 * sirve **sólo en desarrollo**: el circuito completo se prueba sin gastar mails
 * ni tener la clave puesta.
 *
 * En producción sin clave ni remitente verificado no hay transporte de
 * descarte. Devuelve `motivo: "sin-correo"`; nunca se imprime el código en el
 * log de Vercel como sustituto del correo.
 */

const REMITENTE_POR_DEFECTO = "SiezaGym <onboarding@resend.dev>";

export function hayCorreoConfigurado() {
  // onboarding@resend.dev sólo sirve para pruebas de la propia cuenta de
  // Resend; con usuarios reales se necesita un remitente verificado.
  return Boolean(process.env.RESEND_API_KEY)
    && (process.env.NODE_ENV !== "production" || Boolean(process.env.RESEND_FROM));
}

/** En producción el log del servidor no es un transporte: nadie lo lee. */
export function permiteConsola() {
  return process.env.NODE_ENV !== "production";
}

export async function mandarCodigo({ email, codigo, minutos }) {
  if (!hayCorreoConfigurado()) {
    if (!permiteConsola()) {
      console.error("[mfa] falta RESEND_API_KEY o RESEND_FROM: el login por email no puede funcionar");
      return { ok: false, transporte: "ninguno", motivo: "sin-correo" };
    }
    console.warn(`[mfa] sin RESEND_API_KEY: el código de ${email} es ${codigo}`);
    return { ok: true, transporte: "consola" };
  }

  let respuesta;
  try {
    respuesta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || REMITENTE_POR_DEFECTO,
        to: [email],
        subject: `${codigo} es tu código de SiezaGym`,
        text: cuerpoTexto(codigo, minutos),
        html: cuerpoHTML(codigo, minutos),
      }),
    });
  } catch (fallo) {
    console.error("[mfa] no se pudo contactar al proveedor de correo:", fallo);
    return { ok: false, transporte: "resend", motivo: "red" };
  }

  if (!respuesta.ok) {
    const detalle = await respuesta.text();
    // El detalle va al log y no al usuario: puede traer el mail y la razón
    // interna de Resend.
    console.error(`[mfa] Resend respondió ${respuesta.status}: ${detalle}`);
    return { ok: false, transporte: "resend", estado: respuesta.status };
  }

  return { ok: true, transporte: "resend" };
}

/**
 * El código va en el asunto además del cuerpo: así se lee desde la
 * notificación, sin abrir el mail.
 */
function cuerpoTexto(codigo, minutos) {
  return [
    `Tu código para entrar a SiezaGym es ${codigo}.`,
    `Vence en ${minutos} minutos.`,
    "",
    "Si no fuiste vos, alguien sabe tu contraseña: cambiala.",
  ].join("\n");
}

function cuerpoHTML(codigo, minutos) {
  // Tablas y estilos en línea porque los clientes de mail ignoran el CSS de
  // <head> y no soportan flex ni grid de forma pareja.
  return `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:32px 16px;background:#0e0f12;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:420px;margin:0 auto;background:#16181d;border-radius:24px;border:1px solid #24262d;">
      <tr>
        <td style="padding:28px 28px 8px;">
          <p style="margin:0;font-size:11px;letter-spacing:1.6px;font-weight:700;color:#8b8f99;">SIEZAGYM</p>
          <h1 style="margin:10px 0 0;font-size:22px;line-height:1.25;color:#f4f5f7;font-weight:700;">Tu código para entrar</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 28px 4px;">
          <p style="margin:0;padding:18px 0;text-align:center;font-size:36px;letter-spacing:10px;font-weight:700;color:#f4f5f7;background:#1e2027;border-radius:16px;">${codigo}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 28px 28px;">
          <p style="margin:0;font-size:14px;line-height:1.5;color:#8b8f99;">Vence en ${minutos} minutos. Si no fuiste vos, alguien sabe tu contraseña: cambiala.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
