import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import ThemeRoot from "@/components/design2/ThemeRoot";
import Backdrop from "@/components/design2/Backdrop";
import LoginForm from "@/components/LoginForm";

export const dynamic = "force-dynamic";

/**
 * Entrar a la cuenta.
 *
 * Sin barra de pestañas: acá todavía no hay a dónde navegar. El fondo es el
 * del tema elegido, igual que el resto de la app, así que entrar no se siente
 * como si fuera otro producto.
 */
export default async function LoginPage({ searchParams }) {
  const user = await getCurrentUser();
  const params = searchParams ? await searchParams : {};
  const nextUrl = params.next || "/";

  if (user) redirect(nextUrl);

  // /login?mode=signup abre directo en crear cuenta, para los enlaces que
  // mandan a registrarse sin cambiar de pantalla.
  const initialMode = params.mode === "signup" ? "signup" : "signin";

  return (
    <ThemeRoot>
      <Backdrop />
      <div className="d2-page d2-authpage">
        <LoginForm initialMode={initialMode} />
      </div>
    </ThemeRoot>
  );
}
