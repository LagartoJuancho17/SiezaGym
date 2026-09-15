"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { monthSections, shouldGroupByMonth, visibleRoutines } from "@/lib/routines/filter";
import { ChevronRightIcon, PlusIcon, SearchIcon } from "./Icons";

/** Una rutina: nombre, lo que tiene adentro y el paso al detalle. */
function Row({ routine }) {
  const exercises = routine.exerciseCount;
  const meta = [
    `${exercises} ${exercises === 1 ? "ejercicio" : "ejercicios"}`,
    `${routine.totalSets} ${routine.totalSets === 1 ? "serie" : "series"}`,
    `${routine.estimatedMinutes} min`,
  ].join(" · ");

  return (
    <Link href={`/rutinas/${routine.id}`} className="d2-routine">
      <span className="d2-routine-body">
        <span className="d2-routine-name">
          <span>{routine.name}</span>
          {routine.isAssigned && <span className="d2-routine-tag">Del coach</span>}
        </span>
        <span className="d2-routine-meta">{meta}</span>
      </span>
      <ChevronRightIcon size={16} width={1.6} className="d2-routine-go" />
    </Link>
  );
}

/**
 * Lista de rutinas con buscador.
 *
 * Los meses son un rotulo y no un acordeon: llegar a una rutina no puede costar
 * dos clics en dos niveles desplegables. Con una busqueda en curso los rotulos
 * desaparecen, porque cortar tres resultados en secciones los esconde.
 */
export default function RoutineList({ items, months, undated }) {
  const [query, setQuery] = useState("");

  const sections = useMemo(() => monthSections(months, undated), [months, undated]);
  const results = useMemo(() => visibleRoutines(items, query), [items, query]);
  const grouped = shouldGroupByMonth(query);

  return (
    <>
      <div className="d2-glass d2-search">
        <SearchIcon size={25} width={1.5} />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar"
          aria-label="Buscar una rutina"
          className="d2-search-input"
        />
      </div>

      {items.length === 0 ? (
        <p className="d2-glass d2-empty">
          Todavía no tenés rutinas.
          <Link href="/rutinas/nueva" className="d2-empty-action">
            <PlusIcon size={16} width={2} />
            Crear la primera
          </Link>
        </p>
      ) : grouped ? (
        sections.map((section) => (
          <section key={section.monthKey} className="d2-routine-section">
            <h2 className="d2-routine-month">{section.label}</h2>
            <div className="d2-routine-list">
              {section.items.map((routine) => (
                <Row key={routine.key} routine={routine} />
              ))}
            </div>
          </section>
        ))
      ) : results.length > 0 ? (
        <div className="d2-routine-section">
          <div className="d2-routine-list">
            {results.map((routine) => (
              <Row key={routine.key} routine={routine} />
            ))}
          </div>
        </div>
      ) : (
        <p className="d2-glass d2-empty">Ninguna rutina coincide.</p>
      )}
    </>
  );
}
