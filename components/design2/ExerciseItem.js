"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { isTimeBasedRegistration } from "@/lib/exercises/constants";
import { primaryMuscleLabel } from "@/lib/exercises/browse";
import {
  MAX_SETS,
  buildSets,
  isDetailed,
  prescriptionSummary,
  resizeSets,
  setCount,
  toUniform,
} from "@/lib/routines/prescription";
import { CheckIcon, ChevronDownIcon, CloseIcon, WeightIcon } from "./Icons";

/** Campo numerico con su etiqueta. Vacio se guarda como null, no como cero. */
function Field({ label, value, onChange, min = 0, max = 999, placeholder = "—" }) {
  return (
    <label className="d2-field">
      <span>{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(event) => {
          const raw = event.target.value;
          onChange(raw === "" ? null : Number(raw));
        }}
      />
    </label>
  );
}

/**
 * Un ejercicio dentro de la rutina que se arma.
 *
 * Cerrado muestra solo el resumen; abierto, la prescripcion. Se abre de a uno
 * porque una rutina de diez ejercicios con todos los campos desplegados no se
 * puede leer.
 */
export default function ExerciseItem({ item, exercise, onChange, onRemove }) {
  const [open, setOpen] = useState(false);
  const detailId = useId();

  const timeBased = isTimeBasedRegistration(exercise?.registrationType);
  // El peso se pide solo donde tiene sentido: en peso corporal o en plancha no.
  const showWeight = exercise?.registrationType === "peso_reps";
  const repsLabel = timeBased ? "Tiempo (s)" : "Reps";
  const detailed = isDetailed(item);
  const count = setCount(item);

  function setSeries(next) {
    const total = Math.min(MAX_SETS, Math.max(1, Number(next) || 1));
    onChange(
      detailed
        ? { ...item, targetSets: total, sets: resizeSets(item.sets, total) }
        : { ...item, targetSets: total },
    );
  }

  function patchSet(index, changes) {
    onChange({
      ...item,
      sets: item.sets.map((set, position) => (position === index ? { ...set, ...changes } : set)),
    });
  }

  function toggleDetailed() {
    onChange(detailed ? toUniform(item) : { ...item, sets: buildSets(item) });
  }

  return (
    <div>
      <div className="d2-ex-head">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={detailId}
          className="d2-ex-toggle"
        >
          <span className="d2-ex-thumb">
            {exercise?.mediaUrl ? (
              <Image src={exercise.mediaUrl} alt="" width={54} height={54} unoptimized />
            ) : (
              <WeightIcon size={22} width={1.5} />
            )}
          </span>

          <span className="d2-ex-body">
            <span className="d2-ex-name">{exercise?.nameEs || item.exerciseId}</span>
            <span className="d2-ex-muscle">{primaryMuscleLabel(exercise) || "Sin datos"}</span>
          </span>

          <span className="d2-ex-summary">{prescriptionSummary(item, { timeBased })}</span>
          <ChevronDownIcon size={15} width={1.8} className="d2-ex-chevron" />
        </button>

        <button
          type="button"
          onClick={onRemove}
          aria-label={`Quitar ${exercise?.nameEs || "el ejercicio"}`}
          className="d2-ex-remove"
        >
          <CloseIcon size={15} width={1.8} />
        </button>
      </div>

      {open && (
        <div id={detailId} className="d2-ex-detail">
          <div className={detailed ? "d2-fields d2-fields-single" : "d2-fields"}>
            <Field label="Series" value={count} onChange={setSeries} min={1} max={MAX_SETS} />
            {!detailed && (
              <>
                <Field
                  label={repsLabel}
                  value={item.targetReps}
                  onChange={(value) => onChange({ ...item, targetReps: value })}
                  min={1}
                />
                {showWeight && (
                  <Field
                    label="Peso (kg)"
                    value={item.targetWeight}
                    onChange={(value) => onChange({ ...item, targetWeight: value })}
                  />
                )}
                <Field
                  label="RIR"
                  value={item.targetRIR}
                  onChange={(value) => onChange({ ...item, targetRIR: value })}
                  max={10}
                />
              </>
            )}
          </div>

          <button
            type="button"
            onClick={toggleDetailed}
            aria-pressed={detailed}
            className="d2-switch"
          >
            <span className="d2-switch-box">{detailed && <CheckIcon size={11} width={2.4} />}</span>
            Prescribir cada serie por separado
          </button>

          {detailed && (
            <>
              <p className="d2-setrow-legend">
                <span aria-hidden />
                <span>{repsLabel}</span>
                {showWeight && <span>Peso</span>}
                <span>RIR</span>
              </p>

              <div className="d2-setrows">
                {item.sets.map((set, index) => (
                  <div key={set.setNumber} className="d2-setrow">
                    <span className="d2-setrow-n">{set.setNumber}</span>
                    <Field
                      label={repsLabel}
                      value={set.reps}
                      onChange={(value) => patchSet(index, { reps: value })}
                      min={1}
                    />
                    {showWeight && (
                      <Field
                        label="Peso"
                        value={set.weight}
                        onChange={(value) => patchSet(index, { weight: value })}
                      />
                    )}
                    <Field
                      label="RIR"
                      value={set.rir}
                      onChange={(value) => patchSet(index, { rir: value })}
                      max={10}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
