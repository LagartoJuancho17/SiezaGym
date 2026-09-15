"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ROUTINE_KINDS, KIND_LABELS, countByKind, shouldGroupByMonth, visibleRoutines } from "@/lib/routines/filter";
import { ChevronDownIcon, PlusIcon, SearchIcon } from "./Icons";
import RoutineCard from "./RoutineCard";

/**
 * Buscador, solapas y calendario de rutinas.
 *
 * Los meses se despliegan solo cuando no hay filtro: con una busqueda en curso,
 * repartir tres resultados entre acordeones de mes y semana los esconde en vez
 * de mostrarlos, asi que ahi se pasa a lista plana.
 */
export default function RoutinesBrowser({ items, months, undated, currentMonthKey, currentWeek }) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("todas");

  const counts = useMemo(() => countByKind(items), [items]);
  const grouped = shouldGroupByMonth({ query, kind });
  const filtered = useMemo(() => visibleRoutines(items, { query, kind }), [items, query, kind]);

  const [openMonths, setOpenMonths] = useState(() => new Set([currentMonthKey]));
  const [openWeeks, setOpenWeeks] = useState(() => new Set([`${currentMonthKey}:${currentWeek}`]));

  const toggle = (setOpen, key) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <>
      <div className="d2-glass d2-search">
        <SearchIcon size={25} width={1.5} />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar una rutina"
          aria-label="Buscar una rutina"
          className="d2-search-input"
        />
      </div>

      <div className="d2-chips" role="tablist" aria-label="Filtrar rutinas">
        {ROUTINE_KINDS.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={kind === id}
            onClick={() => setKind(id)}
            className={kind === id ? "d2-glass d2-chip d2-chip-active" : "d2-glass d2-chip"}
          >
            {KIND_LABELS[id]}
            <span className="d2-chip-count">{counts[id]}</span>
          </button>
        ))}
      </div>

      {grouped ? (
        <div className="d2-months">
          {months.map((month) => {
            const monthOpen = openMonths.has(month.monthKey);
            return (
              <section key={month.monthKey} className="d2-month">
                <button
                  type="button"
                  aria-expanded={monthOpen}
                  onClick={() => toggle(setOpenMonths, month.monthKey)}
                  className="d2-glass d2-disclosure"
                >
                  <span className="d2-disclosure-label">{month.label}</span>
                  <span className="d2-disclosure-count">
                    {month.total} {month.total === 1 ? "rutina" : "rutinas"}
                  </span>
                  <ChevronDownIcon size={18} width={1.8} className="d2-disclosure-chevron" />
                </button>

                {monthOpen && (
                  <div className="d2-weeks">
                    {month.weeks.map((week) => {
                      const weekKey = `${month.monthKey}:${week.week}`;
                      const weekOpen = openWeeks.has(weekKey);
                      return (
                        <div key={weekKey} className="d2-month">
                          <button
                            type="button"
                            aria-expanded={weekOpen}
                            onClick={() => toggle(setOpenWeeks, weekKey)}
                            className="d2-glass d2-disclosure d2-week-disclosure"
                          >
                            <span className="d2-disclosure-label">{week.label}</span>
                            <span className="d2-disclosure-count">{week.items.length}</span>
                            <ChevronDownIcon size={18} width={1.8} className="d2-disclosure-chevron" />
                          </button>

                          {weekOpen && (
                            <div className="d2-routine-list">
                              {week.items.map((routine) => (
                                <RoutineCard key={routine.key} routine={routine} />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}

          {undated.length > 0 && (
            <section className="d2-month">
              <div className="d2-section-heading">
                <h2>Sin fecha</h2>
              </div>
              <div className="d2-routine-list">
                {undated.map((routine) => (
                  <RoutineCard key={routine.key} routine={routine} />
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <div className="d2-months">
          <div className="d2-routine-list">
            {filtered.map((routine) => (
              <RoutineCard key={routine.key} routine={routine} />
            ))}
          </div>
        </div>
      )}

      {((grouped && months.length === 0 && undated.length === 0) || (!grouped && filtered.length === 0)) && (
        <p className="d2-glass d2-empty">
          {items.length === 0 ? (
            <>
              Todavía no tenés rutinas.
              <br />
              <Link href="/rutinas/nueva" className="d2-empty-action">
                <PlusIcon size={16} width={2} />
                Crear la primera
              </Link>
            </>
          ) : (
            `Ninguna rutina coincide con lo que buscaste.`
          )}
        </p>
      )}
    </>
  );
}
