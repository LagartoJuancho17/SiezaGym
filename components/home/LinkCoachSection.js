"use client";

import { useState } from "react";
import { redeemInvitationCode } from "@/app/actions";
import Toast from "@/components/ui/Toast";

export default function LinkCoachSection() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;

    setLoading(true);
    try {
      const result = await redeemInvitationCode(trimmed);
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

  return (
    <>
      <section
        aria-label="Vincular entrenador"
        className="mb-3 rounded-[22px] border border-dashed border-hair bg-glass p-[15px]"
      >
        <p className="text-[13px] font-semibold tracking-[-0.01em]">
          ¿Entrenás con alguien?
        </p>
        <p className="mt-1 text-[11px] text-faint">
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
            className="font-mono-digit h-[46px] min-w-0 flex-1 rounded-full border border-hair bg-glass2 px-[15px] text-xs tracking-[0.06em] text-text outline-none placeholder:text-faint focus:border-teal2 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="h-[46px] shrink-0 rounded-full px-[18px] text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            style={{
              background:
                "linear-gradient(135deg, var(--teal2) 0%, var(--teal) 100%)",
            }}
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
