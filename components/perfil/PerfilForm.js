"use client";

import { useState } from "react";
import { updateProfile } from "@/app/(app)/perfil/actions";
import { SEX_OPTIONS, SEX_LABELS, EXPERIENCE_LEVELS, EXPERIENCE_LEVEL_LABELS } from "@/lib/users/constants";

function SegmentedField({ label, options, labels, value, onChange }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-faint">{label}</p>
      <div className="flex gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`h-10 flex-1 rounded-full text-xs font-semibold transition ${
              value === opt
                ? "bg-teal text-onlight"
                : "border border-hair bg-glass text-faint hover:text-text"
            }`}
          >
            {labels[opt]}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PerfilForm({ profile }) {
  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [sex, setSex] = useState(profile?.sex || null);
  const [experienceLevel, setExperienceLevel] = useState(profile?.experienceLevel || null);
  const [bodyWeightKg, setBodyWeightKg] = useState(profile?.bodyWeightKg ?? "");
  const [heightCm, setHeightCm] = useState(profile?.heightCm ?? "");
  const [status, setStatus] = useState(null); // 'saving' | 'saved' | 'error' | null
  const [errorMessage, setErrorMessage] = useState(null);

  async function handleSave() {
    setStatus("saving");
    setErrorMessage(null);
    try {
      await updateProfile({
        displayName,
        sex,
        experienceLevel,
        bodyWeightKg: bodyWeightKg === "" ? null : Number(bodyWeightKg),
        heightCm: heightCm === "" ? null : Number(heightCm),
      });
      setStatus("saved");
      setTimeout(() => setStatus(null), 2500);
    } catch (err) {
      setStatus("error");
      setErrorMessage(err.message || "No se pudo guardar.");
      setTimeout(() => setStatus(null), 4000);
    }
  }

  return (
    <section className="flex flex-col gap-5 rounded-[22px] border border-hair bg-glass p-[18px]">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal2">
        Datos personales
      </p>

      <div>
        <label htmlFor="displayName" className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-faint">
          Nombre
        </label>
        <input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="h-11 w-full rounded-xl border border-hair bg-glass2 px-3.5 text-sm text-text outline-none focus:border-teal2"
        />
      </div>

      <SegmentedField
        label="Sexo"
        options={SEX_OPTIONS}
        labels={SEX_LABELS}
        value={sex}
        onChange={setSex}
      />

      <SegmentedField
        label="Experiencia"
        options={EXPERIENCE_LEVELS}
        labels={EXPERIENCE_LEVEL_LABELS}
        value={experienceLevel}
        onChange={setExperienceLevel}
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="bodyWeightKg" className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-faint">
            Peso (kg)
          </label>
          <input
            id="bodyWeightKg"
            type="number"
            inputMode="decimal"
            step="0.1"
            value={bodyWeightKg}
            onChange={(e) => setBodyWeightKg(e.target.value)}
            className="font-mono-digit h-11 w-full rounded-xl border border-hair bg-glass2 px-3.5 text-sm text-text outline-none focus:border-teal2"
          />
        </div>
        <div>
          <label htmlFor="heightCm" className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-faint">
            Altura (cm)
          </label>
          <input
            id="heightCm"
            type="number"
            inputMode="numeric"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            className="font-mono-digit h-11 w-full rounded-xl border border-hair bg-glass2 px-3.5 text-sm text-text outline-none focus:border-teal2"
          />
        </div>
      </div>

      {status === "error" && (
        <p className="text-xs text-destructive">{errorMessage}</p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={status === "saving"}
        className="flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-teal text-sm font-semibold text-onlight transition hover:opacity-90 disabled:opacity-60"
      >
        {status === "saving" ? "Guardando…" : status === "saved" ? "Guardado ✓" : "Guardar cambios"}
      </button>
    </section>
  );
}
