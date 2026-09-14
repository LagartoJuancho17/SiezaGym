"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SearchIcon, WeightIcon } from "./Icons";

/**
 * Actividad reciente, con buscador.
 *
 * El buscador filtra de verdad sobre las sesiones que ya estan en la pagina, en
 * el cliente: son pocas y filtrar contra el servidor por cada tecla no aporta
 * nada. Si el rediseño despues necesita buscar en todo el historial, esto pasa a
 * ser una consulta.
 */
export default function ActivitySection({ activities }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return activities;
    return activities.filter((activity) => activity.name.toLowerCase().includes(term));
  }, [activities, query]);

  return (
    <>
      <div className="d2-glass mt-6 flex items-center gap-2.5 rounded-full px-4 py-3">
        <SearchIcon size={19} className="shrink-0 text-[var(--d2-text-3)]" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar en tu actividad"
          aria-label="Buscar en tu actividad"
          className="w-full bg-transparent text-[15px] placeholder:text-[var(--d2-text-3)] focus:outline-none"
        />
      </div>

      <section className="mt-7 pb-4" aria-labelledby="d2-activity">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="d2-activity" className="text-[19px] font-bold tracking-[-0.01em]">
            Actividad reciente
          </h2>
          <Link href="/historial" className="text-[13px] text-[var(--d2-text-2)] underline-offset-4 hover:underline">
            Ver todo
          </Link>
        </div>

        <ul className="mt-3 flex flex-col gap-2.5">
          {filtered.map((activity) => (
            <li key={activity.id}>
              <Link
                href={`/historial/${activity.id}`}
                className="d2-glass flex items-center gap-3.5 rounded-[24px] p-3 transition active:scale-[0.99]"
              >
                <span className="d2-glass-strong flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-full">
                  <WeightIcon size={22} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[16px] font-bold">{activity.name}</span>
                  <span className="block text-[13px] text-[var(--d2-text-2)]">{activity.when}</span>
                </span>

                <span className="shrink-0 text-right">
                  <span className="block text-[16px] font-bold">{activity.volume}</span>
                  <span className="block text-[12px] text-[var(--d2-text-3)]">{activity.duration}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {filtered.length === 0 && (
          <p className="d2-glass mt-3 rounded-[24px] px-4 py-8 text-center text-[14px] text-[var(--d2-text-2)]">
            {activities.length === 0
              ? "Todavía no registraste entrenamientos."
              : `Ninguna actividad coincide con “${query.trim()}”.`}
          </p>
        )}
      </section>
    </>
  );
}
