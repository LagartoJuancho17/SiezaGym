import Link from "next/link";
import { PlusIcon } from "./Icons";

/**
 * Titular en dos líneas: la primera en regular, la segunda en bold itálica.
 * La segunda línea es el nombre real de la rutina que toca, no una frase.
 */
export default function Headline({ lead, emphasis, href, actionLabel = "Nueva rutina" }) {
  return (
    <div className="d2-headline">
      <h1>
        <span className="d2-headline-lead">{lead}</span>
        <span className="d2-headline-emphasis">{emphasis}</span>
      </h1>

      <Link
        href={href}
        aria-label={actionLabel}
        className="d2-fab"
      >
        <PlusIcon size={24} width={1.4} />
      </Link>
    </div>
  );
}
