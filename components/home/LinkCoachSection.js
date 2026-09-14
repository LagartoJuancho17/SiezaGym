"use client";

import { useState } from "react";
import { redeemInvitationCode } from "@/app/actions";
import Toast from "@/components/ui/Toast";

const CODE_REGEX = /^[A-Z0-9]{3}-[A-Z0-9]{3}$/;

export default function LinkCoachSection() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [linkedCoach, setLinkedCoach] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = code.trim();

    if (!CODE_REGEX.test(trimmed)) {
      setToast({
        message: "Ingresá un código válido (ej: ABC-123).",
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await redeemInvitationCode(trimmed);
      setLinkedCoach(result.coachName);
      setToast({
        message: `¡Vinculado con ${result.coachName}!`,
        type: "success",
      });
      setCode("");
    } catch (err) {
      setToast({
        message: err.message || "Código inválido.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  if (linkedCoach) {
    return (
      <>
        <section
          aria-label="Entrenador vinculado"
          className="rounded-3xl border border-[#6B1717] bg-[#EDE8E1] p-4 shadow-sm sm:p-5"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FF5733]/15 text-[#FF5733]">
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold tracking-[-0.01em] text-[#141414]">
                Estás vinculado
              </p>
              <p className="mt-0.5 text-[11px] text-[#756C65]">
                Entrenás con {linkedCoach}.
              </p>
            </div>
          </div>
        </section>

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onDismiss={() => setToast(null)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <section
        aria-label="Vincular entrenador"
        className="rounded-3xl border border-[#6B1717] bg-[#EDE8E1] p-4 shadow-sm sm:p-5"
      >
        <p className="text-[13px] font-bold tracking-[-0.01em] text-[#141414]">
          ¿Entrenás con alguien?
        </p>
        <p className="mt-1 text-[11px] text-[#756C65]">
          Ingresá su código de invitación.
        </p>
        <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
          <input
            aria-label="Código de invitación"
            placeholder="XXX-XXX"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={7}
            disabled={loading}
            className="font-mono-digit h-[46px] min-w-0 flex-1 rounded-full border border-[#D5CEC4] bg-[#F4F1EC] px-[15px] text-xs tracking-[0.06em] text-[#141414] outline-none placeholder:text-[#756C65] focus:border-[#FF5733] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading}
            className="h-[46px] shrink-0 rounded-full bg-[#FF5733] px-[18px] text-sm font-bold text-white transition hover:opacity-90 active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              "Vincular"
            )}
          </button>
        </form>
      </section>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </>
  );
}
