import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import ThemeRoot from "@/components/design2/ThemeRoot";
import Backdrop from "@/components/design2/Backdrop";
import LoginForm from "@/components/LoginForm";

export const dynamic = "force-dynamic";

/**
 * Crear la cuenta.
 *
 * Sin barra de pestañas: acá todavía no hay a dónde navegar. El fondo es el
 * del tema elegido, igual que el resto de la app, así que entrar no se siente
 * como si fuera otro producto.
 */
export default async function RegisterPage({ searchParams }) {
  const user = await getCurrentUser();
  const params = searchParams ? await searchParams : {};
  const nextUrl = params.next || "/";

  if (user) redirect(nextUrl);

  return (
    <ThemeRoot>
      <Backdrop />
      <div className="d2-page d2-authpage">
        <LoginForm initialMode={"signup"} />
      </div>
    </ThemeRoot>
  );
}
