"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const SWIPE_THRESHOLD = 90;
const DRAG_START_SLOP = 6;
const VISIBLE_DEPTH = 3;

const META_ICONS = {
  exercises: (
    <>
      <circle cx="15.5" cy="5" r="1.9" />
      <path d="M7.6 9.6l3.6-1.6 2.9 2.7 3.3.9" />
      <path d="M11.2 21l1.1-4.6-3.3-2.9.9-4.9" />
      <path d="M5.6 20.2l2.9-2.3" />
    </>
  ),
  sets: (
    <>
      <path d="M6 18v-5" />
      <path d="M12 18V7" />
      <path d="M18 18v-8" />
    </>
  ),
  minutes: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 7.4V12l3 1.9" />
    </>
  ),
};

function MetaRow({ kind, value, label, accent, withRule }) {
  return (
    <div className={withRule ? "border-t border-white/15 pt-3.5" : ""}>
      <div className="flex items-center gap-3.5">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
            accent ? "border-[#FF7A4D]/50 text-[#FF9068]" : "border-white/30 text-white"
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            width="19"
            height="19"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {META_ICONS[kind]}
          </svg>
        </span>
        <p className="flex items-baseline gap-1.5">
          <span className="font-sans text-[26px] font-bold leading-none tracking-tight text-white">
            {value}
          </span>
          <span className="text-[14px] text-white/70">{label}</span>
        </p>
      </div>
    </div>
  );
}

function RoutineCard({ routine, interactive }) {
  const exerciseCount = routine.exercises?.length || 0;

  return (
    <article
      className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-[30px] p-6 shadow-[0_18px_44px_rgba(24,6,6,0.45)] sm:p-7"
      style={{
        background:
          "linear-gradient(150deg, #C4402F 0%, #A8322A 42%, #6E1F1A 100%)",
      }}
    >
      {/* Decoración: círculo grande y barras, como el diseño */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 top-[34%] h-[290px] w-[290px] rounded-full border border-white/12"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-14 right-8 flex items-end gap-5"
      >
        <span className="h-[64px] w-[3px] rounded-full bg-[#FF7A4D]/70" />
        <span className="h-[104px] w-[3px] rounded-full bg-[#FF7A4D]/80" />
        <span className="h-[148px] w-[3px] rounded-full bg-[#FF7A4D]" />
      </div>

      <div className="relative flex items-start justify-between gap-3">
        <h3 className="font-sans line-clamp-2 text-[30px] font-bold leading-[1.05] tracking-tight text-white sm:text-[34px]">
          {routine.name}
        </h3>
        <span
          aria-hidden="true"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/35 text-white"
        >
          <svg
            viewBox="0 0 24 24"
            width="19"
            height="19"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 17L17 7" />
            <path d="M9 7h8v8" />
          </svg>
        </span>
      </div>

      <div className="relative flex flex-col gap-3.5">
        <MetaRow
          kind="exercises"
          value={exerciseCount}
          label={exerciseCount === 1 ? "ejercicio" : "ejercicios"}
          accent
        />
        <MetaRow kind="sets" value={routine.totalSets || 0} label="series" accent withRule />
        <MetaRow kind="minutes" value={routine.estimatedMinutes || 0} label="min" withRule />
      </div>

      <div className="relative flex flex-col items-start gap-3">
        {routine.isAssigned && (
          <span className="rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
            Asignada
          </span>
        )}
        {interactive ? (
          <Link
            href={`/rutinas/${routine.id}`}
            className="inline-flex h-12 items-center gap-2.5 rounded-full border border-white/60 px-6 text-[15px] font-semibold text-white transition hover:bg-white/10 active:scale-[0.98]"
          >
            Ver Rutina
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
          </Link>
        ) : (
          <span
            aria-hidden="true"
            className="inline-flex h-12 items-center gap-2.5 rounded-full border border-white/60 px-6 text-[15px] font-semibold text-white"
          >
            Ver Rutina
          </span>
        )}
      </div>
    </article>
  );
}

function AddRoutineCard({ interactive }) {
  return (
    <article
      className="relative flex h-full w-full flex-col items-start justify-between overflow-hidden rounded-[30px] border-2 border-dashed border-white/25 p-6 shadow-[0_18px_44px_rgba(24,6,6,0.45)] sm:p-7"
      style={{ background: "linear-gradient(150deg, #4A130F 0%, #35080A 55%, #240607 100%)" }}
    >
      <h3 className="font-sans text-[30px] font-bold leading-[1.05] tracking-tight text-white sm:text-[34px]">
        Nueva rutina
      </h3>
      <p className="max-w-[260px] text-[15px] leading-relaxed text-white/70">
        Sumá otro día de entrenamiento o una variante de tu semana.
      </p>
      {interactive ? (
        <Link
          href="/rutinas/nueva"
          className="inline-flex h-12 items-center gap-2.5 rounded-full bg-[#FF5524] px-6 text-[15px] font-semibold text-white transition hover:bg-[#F0491B] active:scale-[0.98]"
        >
          Crear rutina
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
        </Link>
      ) : (
        <span
          aria-hidden="true"
          className="inline-flex h-12 items-center rounded-full bg-[#FF5524] px-6 text-[15px] font-semibold text-white"
        >
          Crear rutina
        </span>
      )}
    </article>
  );
}

export default function RoutinesCarousel({ routines = [] }) {
  const [top, setTop] = useState(0);
  const [dx, setDx] = useState(0);
  const [flyingTo, setFlyingTo] = useState(null);
  // Card que acaba de salir: vuelve al fondo del mazo sin animar el regreso.
  const [noAnimId, setNoAnimId] = useState(null);
  const dragging = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  // El delta vive tambien en un ref: en un flick rapido el pointerup puede
  // llegar antes del re-render y el estado todavia estaria en 0.
  const dxRef = useRef(0);

  // La card de "nueva rutina" es parte del mazo: asi con una sola rutina el
  // gesto de arrastre sigue teniendo a donde ir (antes no se movia nada).
  const items = [
    ...routines.map((routine) => ({ kind: "routine", id: routine.id, routine })),
    { kind: "add", id: "__add__" },
  ];
  const total = items.length;
  const canSwipe = total > 1;
  // Derivado, no sincronizado: si borran rutinas el indice viejo sigue siendo valido.
  const safeTop = total === 0 ? 0 : top % total;

  const advance = (direction) => {
    if (flyingTo) return;
    setFlyingTo(direction);
  };

  const handleFlyEnd = () => {
    if (!flyingTo) return;
    // La card que sale vuelve al fondo: sin esto animaria de vuelta cruzando
    // la pantalla, porque React reusa el nodo (misma key).
    setNoAnimId(items[safeTop]?.id ?? null);
    setFlyingTo(null);
    dxRef.current = 0;
    setDx(0);
    setTop((current) => (current + 1) % total);
    requestAnimationFrame(() => requestAnimationFrame(() => setNoAnimId(null)));
  };

  useEffect(() => {
    if (!flyingTo) return undefined;
    const timer = setTimeout(() => handleFlyEnd(), 420);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyingTo, safeTop, total]);

  const onPointerDown = (event) => {
    if (!canSwipe || flyingTo) return;
    if (event.target.closest("a")) return;
    dragging.current = true;
    setIsDragging(true);
    startX.current = event.clientX;
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      // Algunos navegadores tiran si el pointer ya no esta activo: el drag
      // sigue funcionando igual sin capture.
    }
  };

  const onPointerMove = (event) => {
    if (!dragging.current) return;
    const delta = event.clientX - startX.current;
    if (Math.abs(delta) < DRAG_START_SLOP) return;
    dxRef.current = delta;
    setDx(delta);
  };

  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    setIsDragging(false);
    const delta = dxRef.current;
    dxRef.current = 0;
    if (Math.abs(delta) > SWIPE_THRESHOLD) {
      advance(delta > 0 ? "right" : "left");
    } else {
      setDx(0);
    }
  };

  if (total === 0) {
    return null;
  }

  const visible = Array.from({ length: Math.min(VISIBLE_DEPTH, total) }, (_, depth) => ({
    depth,
    item: items[(safeTop + depth) % total],
  }));

  return (
    <section aria-label="Tus rutinas" className="relative">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#FF5524]">
            Tus Rutinas
          </p>
          <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-semibold text-white">
            {routines.length}
          </span>
        </div>
        <Link
          href="/rutinas"
          className="text-xs font-medium text-white/60 transition hover:text-white"
        >
          Ver todas
        </Link>
      </div>

      {/* Mazo: la card de adelante se desliza y pasa al fondo */}
      <div className="relative mx-auto h-[430px] w-full max-w-[460px] pt-6">
        {visible
          .slice()
          .reverse()
          .map(({ depth, item }) => {
            const isFront = depth === 0;
            const dragRotation = isFront ? dx / 22 : 0;
            const flying = isFront && flyingTo;

            const transform = flying
              ? `translateX(${flyingTo === "right" ? 130 : -130}%) rotate(${
                  flyingTo === "right" ? 16 : -16
                }deg)`
              : `translateX(${isFront ? dx : 0}px) translateY(-${depth * 18}px) scale(${
                  1 - depth * 0.055
                }) rotate(${dragRotation}deg)`;

            return (
              <div
                key={item.id}
                className={`absolute inset-x-0 top-6 bottom-0 select-none ${
                  isFront
                    ? canSwipe
                      ? "cursor-grab touch-pan-y active:cursor-grabbing"
                      : ""
                    : "pointer-events-none"
                }`}
                style={{
                  zIndex: VISIBLE_DEPTH - depth,
                  transform,
                  opacity: flying ? 0 : 1,
                  // Las de atrás se aclaran y desaturan, como en el diseño.
                  filter: isFront ? "none" : `brightness(${1 + depth * 0.55}) saturate(${1 - depth * 0.45})`,
                  transition:
                    item.id === noAnimId || (isDragging && isFront && !flying)
                      ? "none"
                      : "transform 320ms cubic-bezier(0.22, 0.61, 0.36, 1), opacity 320ms ease",
                }}
                onPointerDown={isFront ? onPointerDown : undefined}
                onPointerMove={isFront ? onPointerMove : undefined}
                onPointerUp={isFront ? onPointerUp : undefined}
                onPointerCancel={isFront ? onPointerUp : undefined}
                onTransitionEnd={isFront ? handleFlyEnd : undefined}
                aria-hidden={isFront ? undefined : "true"}
              >
                {item.kind === "add" ? (
                  <AddRoutineCard interactive={isFront && !flying} />
                ) : (
                  <RoutineCard routine={item.routine} interactive={isFront && !flying} />
                )}
              </div>
            );
          })}
      </div>

      {canSwipe && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => advance("right")}
            aria-label="Rutina siguiente"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 text-white/80 transition hover:bg-white/10 active:scale-95"
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>

          <div className="flex items-center gap-1.5">
            {items.map((item, index) => (
              <span
                key={item.id}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === safeTop ? "w-6 bg-[#FF5524]" : "w-2 bg-white/25"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
