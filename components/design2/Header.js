import Image from "next/image";
import Link from "next/link";
import { BoltIcon, BellIcon } from "./Icons";

/**
 * Saludo y estado de la semana.
 *
 * El porcentaje que se muestra es el de la meta semanal de calorías, que es un
 * número real del perfil. No hay un "progreso" global inventado.
 */
export default function Header({ name, photoURL, initial, goalPct, hasGoalData }) {
  return (
    <header className="d2-header">
      <div className="d2-avatar">
        {photoURL ? (
          <Image src={photoURL} alt="" fill sizes="(max-width: 520px) 17vw, 87px" className="object-cover" />
        ) : (
          <span className="d2-avatar-initial">
            {initial}
          </span>
        )}
      </div>

      <div className="d2-greeting">
        <p className="d2-greeting-name">Hola, {name}</p>
        <p className="d2-greeting-progress">
          <BoltIcon size={19} width={1.6} />
          {hasGoalData ? `Meta semanal: ${goalPct}%` : "Sin entrenamientos esta semana"}
        </p>
      </div>

      <Link
        href="/perfil"
        aria-label="Perfil y ajustes"
        className="d2-orb d2-profile-link"
      >
        <BellIcon size={23} width={1.5} />
      </Link>
    </header>
  );
}
