"use client";

import { useMemo, useState } from "react";
import {
  MUSCLE_GROUPS,
  MUSCLE_GROUP_LABELS,
  EQUIPMENT,
  EQUIPMENT_LABELS,
  PATTERNS,
  PATTERN_LABELS,
  REGISTRATION_TYPES,
  REGISTRATION_TYPE_LABELS,
  muscleWeightsSum,
} from "@/lib/exercises/constants";
import { createCustomExercise } from "@/app/rutinas/actions";

const WEIGHT_EPSILON = 0.01;

export default function CustomExerciseForm({ onCreated, onCancel }) {
  const [nameEs, setNameEs] = useState("");
  const [equipment, setEquipment] = useState(EQUIPMENT[0]);
  const [pattern, setPattern] = useState(PATTERNS[0]);
  const [registrationType, setRegistrationType] = useState(REGISTRATION_TYPES[0]);
  const [unilateral, setUnilateral] = useState(false);
  const [descriptionEs, setDescriptionEs] = useState("");
  const [selectedMuscles, setSelectedMuscles] = useState([]);
  const [weights, setWeights] = useState({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const sum = useMemo(() => muscleWeightsSum(weights), [weights]);
  const sumOk = selectedMuscles.length > 0 && Math.abs(sum - 1) <= WEIGHT_EPSILON;

  function toggleMuscle(muscle) {
    setSelectedMuscles((prev) => {
      if (prev.includes(muscle)) {
        setWeights((w) => {
          const next = { ...w };
          delete next[muscle];
          return next;
        });
        return prev.filter((m) => m !== muscle);
      }
      const next = [...prev, muscle];
      setWeights((w) => ({ ...w, [muscle]: w[muscle] ?? 0 }));
      return next;
    });
  }

  function setWeight(muscle, value) {
    const parsed = Math.max(0, Math.min(1, Number(value) || 0));
    setWeights((w) => ({ ...w, [muscle]: parsed }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!nameEs.trim()) {
      setError("Ponele un nombre al ejercicio.");
      return;
    }
    if (!sumOk) {
      setError(`Los pesos musculares suman ${sum.toFixed(2)}, tienen que sumar 1.0.`);
      return;
    }

    setSaving(true);
    try {
      const id = await createCustomExercise({
        nameEs: nameEs.trim(),
        equipment,
        pattern,
        registrationType,
        unilateral,
        descriptionEs,
        muscleWeights: weights,
      });
      onCreated({
        id,
        nameEs: nameEs.trim(),
        nameEn: nameEs.trim(),
        equipment,
        pattern,
        registrationType,
        unilateral,
        descriptionEs,
        muscleWeights: weights,
        mediaUrl: null,
        source: "custom",
      });
    } catch (err) {
      setError(err.message || "No se pudo crear el ejercicio.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-1">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal2">
          Ejercicio propio
        </p>
        <p className="mt-1 text-[11px] text-faint">
          No lo encontrás en el catálogo — creá el tuyo. Es privado, solo lo ves vos.
        </p>
      </div>

      <label className="grid gap-1.5 text-sm text-muted">
        <span>Nombre</span>
        <input
          className="h-11 rounded-xl border border-hair bg-glass2 px-3 text-text outline-none focus:border-teal2"
          value={nameEs}
          onChange={(e) => setNameEs(e.target.value)}
          placeholder="Ej: Press en banco Smith a un brazo"
          required
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1.5 text-sm text-muted">
          <span>Equipamiento</span>
          <select
            className="h-11 rounded-xl border border-hair bg-glass2 px-3 text-text outline-none focus:border-teal2"
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
          >
            {EQUIPMENT.map((eq) => (
              <option key={eq} value={eq}>
                {EQUIPMENT_LABELS[eq]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm text-muted">
          <span>Patrón</span>
          <select
            className="h-11 rounded-xl border border-hair bg-glass2 px-3 text-text outline-none focus:border-teal2"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
          >
            {PATTERNS.map((p) => (
              <option key={p} value={p}>
                {PATTERN_LABELS[p]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1.5 text-sm text-muted">
          <span>Tipo de registro</span>
          <select
            className="h-11 rounded-xl border border-hair bg-glass2 px-3 text-text outline-none focus:border-teal2"
            value={registrationType}
            onChange={(e) => setRegistrationType(e.target.value)}
          >
            {REGISTRATION_TYPES.map((rt) => (
              <option key={rt} value={rt}>
                {REGISTRATION_TYPE_LABELS[rt]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 self-end pb-2.5 text-sm text-muted">
          <input
            type="checkbox"
            checked={unilateral}
            onChange={(e) => setUnilateral(e.target.checked)}
            className="h-4 w-4 accent-teal"
          />
          Unilateral
        </label>
      </div>

      <label className="grid gap-1.5 text-sm text-muted">
        <span>Descripción (opcional)</span>
        <textarea
          className="min-h-16 resize-y rounded-xl border border-hair bg-glass2 px-3 py-2.5 text-text outline-none focus:border-teal2"
          value={descriptionEs}
          onChange={(e) => setDescriptionEs(e.target.value)}
          placeholder="2-3 líneas de técnica"
        />
      </label>

      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted">Músculos que trabaja</span>
          <span
            className={`font-mono-digit text-xs ${sumOk ? "text-teal2" : "text-destructive"}`}
          >
            Total: {sum.toFixed(2)}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-faint">
          Elegí uno o más y repartí el peso entre todos hasta que sumen 1.0 — así entra bien en
          las estadísticas de progreso.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {MUSCLE_GROUPS.map((muscle) => {
            const active = selectedMuscles.includes(muscle);
            return (
              <button
                key={muscle}
                type="button"
                onClick={() => toggleMuscle(muscle)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? "border-teal2 bg-teal2 text-onlight"
                    : "border-hair text-muted hover:border-teal2 hover:text-text"
                }`}
              >
                {MUSCLE_GROUP_LABELS[muscle]}
              </button>
            );
          })}
        </div>

        {selectedMuscles.length > 0 ? (
          <div className="mt-3 flex flex-col gap-2">
            {selectedMuscles.map((muscle) => (
              <div key={muscle} className="flex items-center gap-3">
                <span className="w-40 shrink-0 truncate text-xs text-muted">
                  {MUSCLE_GROUP_LABELS[muscle]}
                </span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={weights[muscle] ?? 0}
                  onChange={(e) => setWeight(muscle, e.target.value)}
                  className="h-1.5 flex-1 accent-teal"
                />
                <span className="font-mono-digit w-10 shrink-0 text-right text-xs text-text">
                  {(weights[muscle] ?? 0).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-11 flex-1 rounded-full border border-hair text-sm font-semibold text-text transition hover:bg-glass2"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving || !sumOk || !nameEs.trim()}
          className="h-11 flex-1 rounded-full bg-teal2 text-sm font-semibold text-onlight transition hover:opacity-90 disabled:opacity-40"
        >
          {saving ? "Creando..." : "Crear ejercicio"}
        </button>
      </div>
    </form>
  );
}
