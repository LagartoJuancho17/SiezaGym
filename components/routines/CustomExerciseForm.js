"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
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
import { createCustomExercise } from "@/app/(app)/rutinas/actions";
import {
  extractYouTubeId,
  cleanYouTubeUrl,
  getYouTubeThumbnailUrl,
} from "@/lib/exercises/youtube";

const WEIGHT_EPSILON = 0.01;

export default function CustomExerciseForm({ onCreated, onCancel }) {
  const [nameEs, setNameEs] = useState("");
  const [equipment, setEquipment] = useState("");
  const [pattern, setPattern] = useState("");
  const [registrationType, setRegistrationType] = useState(REGISTRATION_TYPES[0]);
  const [unilateral, setUnilateral] = useState(false);
  const [descriptionEs, setDescriptionEs] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [selectedMuscles, setSelectedMuscles] = useState([]);
  const [weights, setWeights] = useState({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const videoId = useMemo(() => extractYouTubeId(videoUrl), [videoUrl]);
  const isInvalidVideo = videoUrl.trim() !== "" && !videoId;

  const sum = useMemo(() => muscleWeightsSum(weights), [weights]);
  const hasMuscles = selectedMuscles.length > 0;
  const sumOk = !hasMuscles || Math.abs(sum - 1) <= WEIGHT_EPSILON;

  function toggleMuscle(muscle) {
    setSelectedMuscles((prev) => {
      let next;
      if (prev.includes(muscle)) {
        next = prev.filter((m) => m !== muscle);
      } else {
        next = [...prev, muscle];
      }

      if (next.length === 0) {
        setWeights({});
      } else {
        // Repartir automáticamente para que siempre sumen 1.0 por defecto
        const evenWeight = Number((1 / next.length).toFixed(2));
        const newWeights = {};
        let currentTotal = 0;
        next.forEach((m, idx) => {
          if (idx === next.length - 1) {
            newWeights[m] = Number((1 - currentTotal).toFixed(2));
          } else {
            newWeights[m] = evenWeight;
            currentTotal += evenWeight;
          }
        });
        setWeights(newWeights);
      }
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
    if (hasMuscles && !sumOk) {
      setError(`Los pesos musculares suman ${sum.toFixed(2)}, tienen que sumar 1.0.`);
      return;
    }

    const finalEquipment = equipment || null;
    const finalPattern = pattern || null;
    const finalWeights = hasMuscles ? weights : {};
    const finalVideoUrl = videoId ? cleanYouTubeUrl(videoUrl) : null;
    const finalMediaUrl = videoId ? getYouTubeThumbnailUrl(videoId) : null;

    setSaving(true);
    try {
      const id = await createCustomExercise({
        nameEs: nameEs.trim(),
        equipment: finalEquipment,
        pattern: finalPattern,
        registrationType,
        unilateral,
        descriptionEs: descriptionEs.trim(),
        muscleWeights: finalWeights,
        videoUrl: finalVideoUrl,
      });
      onCreated({
        id,
        nameEs: nameEs.trim(),
        nameEn: nameEs.trim(),
        equipment: finalEquipment,
        pattern: finalPattern,
        registrationType,
        unilateral,
        descriptionEs: descriptionEs.trim(),
        muscleWeights: finalWeights,
        mediaUrl: finalMediaUrl,
        videoUrl: finalVideoUrl,
        source: "custom",
      });
    } catch (err) {
      setError(err.message || "No se pudo crear el ejercicio.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="d2-panel d2-form d2-custom-form">
      <div>
        <p className="d2-setting-name">
          Ejercicio propio
        </p>
        <p className="d2-setting-hint">
          No lo encontrás en el catálogo: creá el tuyo. Es privado, solo lo ves vos.
        </p>
      </div>

      <label className="d2-form-field">
        <span>Nombre</span>
        <input
          className="d2-input"
          value={nameEs}
          onChange={(e) => setNameEs(e.target.value)}
          placeholder="Ej: Press en banco Smith a un brazo"
          required
        />
      </label>

      <div className="d2-pair">
        <label className="d2-form-field">
          <span>Equipamiento</span>
          <select
            className="d2-input"
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
          >
            <option value="">Sin especificar (opcional)</option>
            {EQUIPMENT.map((eq) => (
              <option key={eq} value={eq}>
                {EQUIPMENT_LABELS[eq]}
              </option>
            ))}
          </select>
        </label>
        <label className="d2-form-field">
          <span>Patrón</span>
          <select
            className="d2-input"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
          >
            <option value="">Sin especificar (opcional)</option>
            {PATTERNS.map((p) => (
              <option key={p} value={p}>
                {PATTERN_LABELS[p]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="d2-pair">
        <label className="d2-form-field">
          <span>Tipo de registro</span>
          <select
            className="d2-input"
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
        <label className="d2-inline-actions">
          <input
            type="checkbox"
            checked={unilateral}
            onChange={(e) => setUnilateral(e.target.checked)}
            className="d2-checkbox"
          />
          Unilateral
        </label>
      </div>

      <label className="d2-form-field">
        <span>Descripción (opcional)</span>
        <textarea
          className="d2-input d2-textarea"
          value={descriptionEs}
          onChange={(e) => setDescriptionEs(e.target.value)}
          placeholder="2-3 líneas de técnica"
        />
      </label>

      <label className="d2-form-field">
        <span>Video de YouTube (opcional)</span>
        <div className="flex items-center gap-3">
          <input
            className="d2-input flex-1"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="Pegá el link (ej: https://youtu.be/... o youtube.com/watch?v=...)"
            type="url"
          />
          {videoId && (
            <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-[var(--d2-border)] bg-black/20">
              <Image
                src={getYouTubeThumbnailUrl(videoId)}
                alt="Vista previa de portada"
                width={56}
                height={56}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>
          )}
        </div>
        <span className={`text-xs mt-1 ${isInvalidVideo ? "text-amber-400" : "text-muted"}`}>
          {isInvalidVideo
            ? "Ese enlace no parece ser un link válido de YouTube."
            : videoId
            ? "✓ La portada del video quedará como miniatura del ejercicio."
            : "La portada del video de YouTube queda como miniatura del ejercicio."}
        </span>
      </label>

      <div>
        <div className="d2-inline-actions">
          <span className="d2-form-note">Músculos que trabaja (opcional)</span>
          {hasMuscles && (
            <span className="d2-form-note" role="status">
              Total: {sum.toFixed(2)}
            </span>
          )}
        </div>
        <p className="d2-setting-hint">
          Opcional: elegí uno o más músculos si querés que sume al reparto muscular y estadísticas.
        </p>
        <div className="d2-segs">
          {MUSCLE_GROUPS.map((muscle) => {
            const active = selectedMuscles.includes(muscle);
            return (
              <button
                key={muscle}
                type="button"
                onClick={() => toggleMuscle(muscle)}
                aria-pressed={active}
                className={active ? "d2-seg d2-seg-on" : "d2-seg"}
              >
                {MUSCLE_GROUP_LABELS[muscle]}
              </button>
            );
          })}
        </div>

        {hasMuscles ? (
          <div className="d2-stack">
            {selectedMuscles.map((muscle) => (
              <div key={muscle} className="d2-range-row">
                <span className="d2-form-note">
                  {MUSCLE_GROUP_LABELS[muscle]}
                </span>
                <input
                  aria-label={`Participación de ${MUSCLE_GROUP_LABELS[muscle]}`}
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={weights[muscle] ?? 0}
                  onChange={(e) => setWeight(muscle, e.target.value)}
                  className="d2-range"
                />
                <span className="d2-form-note">
                  {(weights[muscle] ?? 0).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="d2-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="d2-modal-actions">
        <button
          type="button"
          onClick={onCancel}
          className="d2-modal-secondary"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving || !nameEs.trim() || (hasMuscles && !sumOk)}
          className="d2-form-save"
        >
          {saving ? "Creando..." : "Crear ejercicio"}
        </button>
      </div>
    </form>
  );
}
