import Link from "next/link";
import { BellIcon } from "./Icons";

/**
 * Encabezado de las pantallas que no son la portada: titulo, una linea de
 * contexto y el acceso al perfil, en el mismo lugar que el de la portada para
 * que la cabecera no se mueva al cambiar de seccion.
 */
export default function PageHeader({ title, subtitle }) {
  return (
    <header className="d2-page-head">
      <div className="d2-page-titles">
        <h1 className="d2-page-title">{title}</h1>
        {subtitle && <p className="d2-page-subtitle">{subtitle}</p>}
      </div>

      <Link href="/perfil" aria-label="Perfil y ajustes" className="d2-orb d2-profile-link">
        <BellIcon size={23} width={1.5} />
      </Link>
    </header>
  );
}
