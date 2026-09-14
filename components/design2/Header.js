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
    <header className="flex items-center gap-3">
      <div className="d2-glass relative h-[52px] w-[52px] shrink-0 overflow-hidden rounded-full">
        {photoURL ? (
          <Image src={photoURL} alt="" fill sizes="52px" className="object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[19px] font-bold">
            {initial}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[21px] font-bold leading-tight">Hola, {name}</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-[var(--d2-text-2)]">
          <BoltIcon size={14} />
          {hasGoalData ? `Meta semanal: ${goalPct}%` : "Sin entrenamientos esta semana"}
        </p>
      </div>

      <Link
        href="/perfil"
        aria-label="Perfil y ajustes"
        className="d2-glass flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full transition active:scale-95"
      >
        <BellIcon size={21} />
      </Link>
    </header>
  );
}
