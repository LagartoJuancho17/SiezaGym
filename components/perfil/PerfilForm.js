"use client";

import { useState } from "react";
import { updateProfile } from "@/app/(app)/perfil/actions";
import { SEX_OPTIONS, SEX_LABELS, EXPERIENCE_LEVELS, EXPERIENCE_LEVEL_LABELS } from "@/lib/users/constants";

function SegmentedField({ label, options, labels, value, onChange }) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[#756C65]">{label}</p>
      <div className="flex gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`h-10 flex-1 rounded-full text-xs font-bold transition ${
              value === opt
                ? "bg-[#FF5733] text-white shadow-sm"
                : "border border-[#D5CEC4] bg-[#E3DDD3] text-[#756C65] hover:text-[#141414]"
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
    <section className="flex flex-col gap-5 rounded-3xl border border-[#6B1717] bg-[#EDE8E1] p-5 sm:p-6 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#FF5733]">
        Datos personales
      </p>

      <div>
        <label htmlFor="displayName" className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#756C65]">
          Nombre
        </label>
        <input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="h-11 w-full rounded-xl border border-[#D5CEC4] bg-[#E3DDD3] px-3.5 text-sm font-semibold text-[#141414] outline-none focus:border-[#FF5733]"
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
          <label htmlFor="bodyWeightKg" className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#756C65]">
            Peso (kg)
          </label>
          <input
            id="bodyWeightKg"
            type="number"
            inputMode="decimal"
            step="0.1"
            value={bodyWeightKg}
            onChange={(e) => setBodyWeightKg(e.target.value)}
            className="font-mono h-11 w-full rounded-xl border border-[#D5CEC4] bg-[#E3DDD3] px-3.5 text-sm font-bold text-[#141414] outline-none focus:border-[#FF5733]"
          />
        </div>
        <div>
          <label htmlFor="heightCm" className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#756C65]">
            Altura (cm)
          </label>
          <input
            id="heightCm"
            type="number"
            inputMode="numeric"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            className="font-mono h-11 w-full rounded-xl border border-[#D5CEC4] bg-[#E3DDD3] px-3.5 text-sm font-bold text-[#141414] outline-none focus:border-[#FF5733]"
          />
        </div>
      </div>

      {status === "error" && (
        <p className="text-xs text-[#E84D29]">{errorMessage}</p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={status === "saving"}
        className="flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-[#FF5733] text-sm font-bold text-white shadow-sm transition hover:bg-[#E84D29] active:scale-98 disabled:opacity-60"
      >
        {status === "saving" ? "Guardando…" : status === "saved" ? "Guardado ✓" : "Guardar cambios"}
      </button>
    </section>
  );
}
