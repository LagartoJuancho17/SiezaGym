"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SearchIcon, WeightIcon } from "./Icons";
import { visibleActivities } from "@/lib/home/activity-search";

/**
 * Buscador y actividad reciente.
 *
 * Van juntos en un componente aunque en pantalla estén separados: el buscador
 * va arriba de todo, como en la referencia, y la lista que filtra está más
 * abajo. Lo que queda en el medio entra por `children` y se sigue renderizando
 * en el servidor.
 *
 * Filtra en el cliente sobre las sesiones que ya están en la página: son pocas
 * y consultar al servidor por cada tecla no aporta nada. Si el rediseño después
 * necesita buscar en todo el historial, esto pasa a ser una consulta.
 */
export default function SearchAndActivity({ activities, children }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => visibleActivities(activities, query), [activities, query]);

  return (
    <>
      <div className="d2-glass d2-search">
        <SearchIcon size={25} width={1.4} />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar"
          aria-label="Buscar en tu actividad"
          className="d2-search-input"
        />
      </div>

      {children}

      <section className="d2-activity" aria-labelledby="d2-activity">
        <div className="d2-section-heading">
          <h2 id="d2-activity">
            Actividad reciente
          </h2>
          <Link href="/historial">
            Ver todo
          </Link>
        </div>

        <ul className="d2-activity-list" aria-live="polite" aria-relevant="additions removals">
          {filtered.map((activity) => (
            <li key={activity.id}>
              <Link
                href={`/historial/${activity.id}`}
                className="d2-glass d2-activity-row"
              >
                <span className="d2-orb d2-activity-icon">
                  <WeightIcon size={26} width={1.5} />
                </span>

                <span className="d2-activity-description">
                  <span className="d2-activity-name">{activity.name}</span>
                  <span className="d2-activity-secondary">{activity.when}</span>
                </span>

                <span className="d2-activity-metrics">
                  <span className="d2-activity-volume">{activity.volume}</span>
                  <span className="d2-activity-secondary">{activity.duration}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {filtered.length === 0 && (
          <p className="d2-glass d2-activity-empty" role="status">
            {activities.length === 0
              ? "Todavía no registraste entrenamientos."
              : `Ninguna actividad coincide con “${query.trim()}”.`}
          </p>
        )}
      </section>
    </>
  );
}
