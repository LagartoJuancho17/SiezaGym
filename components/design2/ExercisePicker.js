"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { MUSCLE_REGIONS, filterExercises, primaryMuscleLabel } from "@/lib/exercises/browse";
import { CheckIcon, CloseIcon, SearchIcon, WeightIcon } from "./Icons";

/**
 * Selector de ejercicios a pantalla completa.
 *
 * Se eligen varios y se confirman de una: volver al armador por cada ejercicio
 * obliga a repetir busqueda y filtro cada vez.
 */
export default function ExercisePicker({ exercises, alreadyAdded, onCancel, onConfirm }) {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState(null);
  const [chosen, setChosen] = useState(() => new Set());

  const results = useMemo(
    () => filterExercises(exercises, { query, region }),
    [exercises, query, region],
  );

  function toggle(id) {
    setChosen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="d2-sheet d2-backdrop" role="dialog" aria-modal="true" aria-label="Elegir ejercicios">
      <div className="d2-sheet-inner">
        <div className="d2-sheet-head">
          <p className="d2-sheet-title">Ejercicios</p>
          <button type="button" onClick={onCancel} aria-label="Cerrar" className="d2-back">
            <CloseIcon size={20} width={1.8} />
          </button>
        </div>

        <div className="d2-glass d2-search">
          <SearchIcon size={25} width={1.5} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar un ejercicio"
            aria-label="Buscar un ejercicio"
            className="d2-search-input"
          />
        </div>

        <div className="d2-regions">
          <button
            type="button"
            onClick={() => setRegion(null)}
            aria-pressed={region === null}
            className={region === null ? "d2-region d2-region-active" : "d2-region"}
          >
            Todos
          </button>
          {MUSCLE_REGIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setRegion(region === item.id ? null : item.id)}
              aria-pressed={region === item.id}
              className={region === item.id ? "d2-region d2-region-active" : "d2-region"}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="d2-picks">
          {results.length === 0 ? (
            <p className="d2-glass d2-empty">Ningún ejercicio coincide.</p>
          ) : (
            <div className="d2-panel">
              {results.map((exercise) => {
                const added = alreadyAdded.has(exercise.id);
                const on = chosen.has(exercise.id);
                return (
                  <button
                    key={exercise.id}
                    type="button"
                    onClick={() => !added && toggle(exercise.id)}
                    disabled={added}
                    aria-pressed={on}
                    className={on ? "d2-pick d2-pick-on" : "d2-pick"}
                  >
                    <span className="d2-ex-thumb">
                      {exercise.mediaUrl ? (
                        <Image src={exercise.mediaUrl} alt="" width={54} height={54} unoptimized />
                      ) : (
                        <WeightIcon size={22} width={1.5} />
                      )}
                    </span>
                    <span className="d2-ex-body">
                      <span className="d2-ex-name">{exercise.nameEs}</span>
                      <span className="d2-ex-muscle">
                        {[primaryMuscleLabel(exercise), added ? "ya está en la rutina" : null]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </span>
                    <span className="d2-pick-check">{on && <CheckIcon size={13} width={2.2} />}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Las animaciones no son nuestras: la atribución va donde se ven. */}
          <p className="d2-credit">
            Animaciones ©{" "}
            <a href="https://gymvisual.com/" target="_blank" rel="noopener noreferrer">
              Gym visual
            </a>
          </p>
        </div>
      </div>

      <div className="d2-sheet-foot">
        <button
          type="button"
          disabled={chosen.size === 0}
          onClick={() => onConfirm(results.filter((item) => chosen.has(item.id)))}
          className="d2-sheet-confirm"
        >
          {chosen.size === 0
            ? "Elegí al menos uno"
            : `Agregar ${chosen.size} ${chosen.size === 1 ? "ejercicio" : "ejercicios"}`}
        </button>
      </div>
    </div>
  );
}
