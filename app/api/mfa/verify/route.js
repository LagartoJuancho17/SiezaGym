/**
 * Paso 2 del segundo factor: el código correcto y recién ahí la sesión.
 *
 * Devuelve un custom token, que es lo que la app cambia por una sesión de
 * Firebase con `signIn(withCustomToken:)`. Es el único lugar de este flujo que
 * devuelve una credencial; Firebase password directo requiere protección
 * adicional en reglas y sesiones web.
 */
import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { INTENTOS_MAX } from "@/lib/mfa/challenge";
import { consumirDesafio } from "@/lib/mfa/store";
import { ensureUserProfile } from "@/lib/users/users";

export async function POST(request) {
  const cuerpo = await request.json().catch(() => ({}));
  const id = String(cuerpo.desafio || "");

  const veredicto = await consumirDesafio(id, cuerpo.codigo);

  if (!veredicto.ok) {
    return NextResponse.json(
      { motivo: veredicto.motivo, mensaje: mensaje(veredicto), restantes: veredicto.restantes },
      { status: veredicto.motivo === "inexistente" ? 404 : 401 },
    );
  }

  const usuario = await getAdminAuth().getUser(veredicto.uid);

  // El perfil se asegura acá igual que en la web al iniciar sesión, con los
  // mismos campos: el uid y los datos quedan idénticos entre el celular y el
  // navegador.
  await ensureUserProfile({
    uid: usuario.uid,
    email: usuario.email || null,
    displayName: usuario.displayName || null,
    photoURL: usuario.photoURL || null,
    provider: "password",
  });

  const token = await getAdminAuth().createCustomToken(usuario.uid);

  return NextResponse.json({ token });
}

function mensaje(veredicto) {
  switch (veredicto.motivo) {
    case "inexistente":
      return "Ese código ya no sirve. Pedí uno nuevo.";
    case "vencido":
      return "El código venció. Pedí uno nuevo.";
    case "quemado":
      return `Probaste ${INTENTOS_MAX} veces. Pedí un código nuevo.`;
    case "incompleto":
      return "El código son 6 números.";
    default:
      return veredicto.restantes === 1
        ? "Código incorrecto. Te queda 1 intento."
        : `Código incorrecto. Te quedan ${veredicto.restantes} intentos.`;
  }
}
