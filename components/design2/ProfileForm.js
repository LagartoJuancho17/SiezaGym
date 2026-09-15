"use client";

import { useState } from "react";
import { updateProfile } from "@/app/(app)/perfil/actions";
import {
  EXPERIENCE_LEVELS,
  EXPERIENCE_LEVEL_LABELS,
  SEX_LABELS,
  SEX_OPTIONS,
} from "@/lib/users/constants";

/** Opciones en línea. Volver a tocar la elegida la desmarca: nada es obligatorio. */
function Choice({ label, options, labels, value, onChange }) {
  return (
    <div>
      <span className="d2-form-label">{label}</span>
      <div className="d2-segs" role="radiogroup" aria-label={label}>
        {options.map((option) => {
          const active = value === option;

          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(active ? null : option)}
              className={active ? "d2-seg d2-seg-on" : "d2-seg"}
            >
              {labels[option]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Los datos de la cuenta.
 *
 * El peso corporal no es decorativo: la Home lo usa para estimar las calorías
 * de la semana. Vacío significa que no se cargó, y ahí la estimación usa un
 * valor por defecto y lo declara.
 */
export default function ProfileForm({ profile }) {
  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [sex, setSex] = useState(profile?.sex || null);
  const [experienceLevel, setExperienceLevel] = useState(profile?.experienceLevel || null);
  const [bodyWeightKg, setBodyWeightKg] = useState(profile?.bodyWeightKg ?? "");
  const [heightCm, setHeightCm] = useState(profile?.heightCm ?? "");
  const [status, setStatus] = useState(null); // "saving" | "saved" | null
  const [error, setError] = useState("");

  async function save() {
    setError("");
    if (!displayName.trim()) {
      setError("El nombre no puede quedar vacío.");
      return;
    }

    setStatus("saving");
    try {
      await updateProfile({
        displayName,
        sex,
        experienceLevel,
        bodyWeightKg: bodyWeightKg === "" ? null : Number(bodyWeightKg),
        heightCm: heightCm === "" ? null : Number(heightCm),
      });
      setStatus("saved");
    } catch (err) {
      setStatus(null);
      setError(err.message || "No se pudo guardar.");
    }
  }

  // Cualquier cambio posterior borra el "Guardado": si queda puesto, deja de
  // decir la verdad en cuanto se toca un campo.
  function edited(apply) {
    return (value) => {
      if (status === "saved") setStatus(null);
      apply(value);
    };
  }

  return (
    <div className="d2-panel d2-form">
      <div>
        <label className="d2-form-label" htmlFor="displayName">
          Nombre
        </label>
        <input
          id="displayName"
          value={displayName}
          onChange={(event) => edited(setDisplayName)(event.target.value)}
          maxLength={60}
          placeholder="Cómo querés que te llamemos"
          className="d2-input"
        />
      </div>

      <Choice
        label="Sexo"
        options={SEX_OPTIONS}
        labels={SEX_LABELS}
        value={sex}
        onChange={edited(setSex)}
      />

      <Choice
        label="Experiencia"
        options={EXPERIENCE_LEVELS}
        labels={EXPERIENCE_LEVEL_LABELS}
        value={experienceLevel}
        onChange={edited(setExperienceLevel)}
      />

      <div className="d2-pair">
        <div>
          <label className="d2-form-label" htmlFor="bodyWeightKg">
            Peso (kg)
          </label>
          <input
            id="bodyWeightKg"
            type="number"
            inputMode="decimal"
            step="0.1"
            min={1}
            max={400}
            placeholder="—"
            value={bodyWeightKg}
            onChange={(event) => edited(setBodyWeightKg)(event.target.value)}
            className="d2-input"
          />
        </div>
        <div>
          <label className="d2-form-label" htmlFor="heightCm">
            Altura (cm)
          </label>
          <input
            id="heightCm"
            type="number"
            inputMode="numeric"
            min={1}
            max={260}
            placeholder="—"
            value={heightCm}
            onChange={(event) => edited(setHeightCm)(event.target.value)}
            className="d2-input"
          />
        </div>
      </div>

      <div className="d2-form-foot">
        <button type="button" onClick={save} disabled={status === "saving"} className="d2-form-save">
          {status === "saving" ? "Guardando…" : "Guardar"}
        </button>
        <p className="d2-form-note" role="status">
          {error || (status === "saved" ? "Listo, guardado." : "")}
        </p>
      </div>
    </div>
  );
}
