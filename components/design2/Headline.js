import Link from "next/link";
import { PlusIcon } from "./Icons";

/**
 * Titular en dos líneas: la primera en regular, la segunda en bold itálica.
 * La segunda línea es el nombre real de la rutina que toca, no una frase.
 */
export default function Headline({ lead, emphasis, href }) {
  return (
    <div className="mt-7 flex items-start justify-between gap-4">
      <h1 className="min-w-0 text-[34px] leading-[1.06] tracking-[-0.02em]">
        <span className="block font-medium">{lead}</span>
        <span className="block break-words font-extrabold italic">{emphasis}</span>
      </h1>

      <Link
        href={href}
        aria-label="Nueva rutina"
        className="mt-1 flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-full bg-[var(--d2-ink)] text-white shadow-[0_10px_26px_rgba(17,19,21,0.35)] transition active:scale-95"
      >
        <PlusIcon size={24} width={2} />
      </Link>
    </div>
  );
}
