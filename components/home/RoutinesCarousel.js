"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

function RoutineCardItem({ routine, index, totalRoutines, isDesktop = false }) {
  return (
    <article
      className={`group relative flex min-h-[290px] flex-col justify-between overflow-hidden rounded-[28px] border border-white/10 bg-deep px-5 py-6 transition-all duration-300 hover:border-teal/50 hover:shadow-[0_12px_36px_rgba(0,0,0,0.45)] ${
        isDesktop ? "w-full" : "w-[84vw] max-w-[340px] shrink-0 snap-start"
      }`}
    >
      {/* Background Ambient Radial Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            index % 2 === 0
              ? "radial-gradient(90% 70% at 20% 0%, rgba(63,169,188,0.3) 0%, transparent 70%)"
              : "radial-gradient(90% 70% at 20% 0%, rgba(87,192,206,0.25) 0%, transparent 70%)",
        }}
      />

      {/* Top row: Badge and Order */}
      <div className="relative flex items-center justify-between">
        <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70">
          Rutina {index + 1} de {totalRoutines}
        </span>
        <span className="font-mono text-xs font-semibold text-teal2">
          ~{routine.estimatedMinutes || 0} min
        </span>
      </div>

      {/* Center: Title and stats */}
      <div className="relative my-auto py-3">
        <h3 className="font-display line-clamp-2 text-[28px] sm:text-[30px] uppercase leading-[0.96] tracking-wide text-white">
          {routine.name}
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-white/70">
          {routine.exercises?.length || 0} {routine.exercises?.length === 1 ? "ejercicio" : "ejercicios"} · {routine.totalSets || 0} series
        </p>
      </div>

      {/* Bottom Actions */}
      <div className="relative flex flex-col gap-2">
        <Link
          href={`/rutinas/${routine.id}`}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-white text-sm font-semibold text-onlight shadow-md transition hover:opacity-90 active:scale-[0.98]"
        >
          Ver rutina
          <svg
            viewBox="0 0 24 24"
            width="15"
            height="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </article>
  );
}

function AddRoutineCardItem({ isDesktop = false, highlighted = false }) {
  return (
    <article
      className={`group relative flex min-h-[290px] flex-col items-center justify-between overflow-hidden rounded-[28px] border-2 border-dashed border-teal/40 bg-deep/80 p-6 text-center transition-all duration-300 hover:border-teal hover:bg-deep ${
        isDesktop ? "w-full" : "w-[84vw] max-w-[340px] shrink-0 snap-start"
      } ${
        highlighted
          ? "ring-4 ring-teal ring-offset-2 ring-offset-bg scale-[1.02] shadow-[0_0_35px_rgba(63,169,188,0.5)]"
          : ""
      }`}
    >
      {/* Animated Background Pulse Aura */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 animate-pulse opacity-40 transition-opacity group-hover:opacity-75"
        style={{
          background:
            "radial-gradient(circle at 50% 40%, rgba(63,169,188,0.3) 0%, transparent 65%)",
        }}
      />

      {/* Top badge */}
      <div className="relative">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/30 bg-teal/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-teal2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-teal" />
          </span>
          Sumar día
        </span>
      </div>

      {/* Center: Animated Icon + Text */}
      <div className="relative my-auto flex flex-col items-center py-2">
        <div className="relative mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-teal via-teal2 to-cyan-200 text-onlight shadow-[0_0_24px_rgba(63,169,188,0.4)] transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_32px_rgba(63,169,188,0.6)]">
          <svg
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          >
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
        </div>

        <h3 className="font-display text-[24px] uppercase leading-none tracking-wide text-white">
          Nueva rutina
        </h3>
        <p className="mt-2 max-w-[210px] text-xs leading-snug text-white/70">
          Agregá otra rutina para sumar un nuevo día o variante semanal.
        </p>
      </div>

      {/* Bottom Action Button */}
      <div className="relative w-full">
        <Link
          href="/rutinas/nueva"
          className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-teal via-teal2 to-teal text-sm font-semibold text-onlight shadow-[0_4px_20px_rgba(63,169,188,0.35)] transition-all hover:opacity-95 active:scale-[0.98]"
        >
          <svg
            viewBox="0 0 24 24"
            width="15"
            height="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          >
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          Crear rutina extra
        </Link>
      </div>
    </article>
  );
}

export default function RoutinesCarousel({ routines = [] }) {
  const trackRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [addHighlighted, setAddHighlighted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const dragDistanceRef = useRef(0);

  const totalSlides = routines.length + 1;

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    let timeoutId;
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (!el) return;
        const scrollLeft = el.scrollLeft;
        const cardWidth = el.firstElementChild?.offsetWidth || 300;
        const gap = 14;
        const newIndex = Math.round(scrollLeft / (cardWidth + gap));
        setActiveIndex(Math.min(Math.max(newIndex, 0), totalSlides - 1));
      }, 50);
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      clearTimeout(timeoutId);
      el.removeEventListener("scroll", handleScroll);
    };
  }, [totalSlides]);

  const scrollToIndex = (index) => {
    if (!trackRef.current) return;
    const children = trackRef.current.children;
    if (children[index]) {
      children[index].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });
      setActiveIndex(index);
    }
  };

  const handleTriggerAddAnimation = () => {
    scrollToIndex(routines.length);
    setAddHighlighted(true);
    setTimeout(() => {
      setAddHighlighted(false);
    }, 1500);
  };

  const handleMouseDown = (e) => {
    if (!trackRef.current) return;
    setIsDragging(true);
    startXRef.current = e.pageX - trackRef.current.offsetLeft;
    scrollLeftRef.current = trackRef.current.scrollLeft;
    dragDistanceRef.current = 0;
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !trackRef.current) return;
    e.preventDefault();
    const x = e.pageX - trackRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.3;
    dragDistanceRef.current = Math.abs(walk);
    trackRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleCardClickCapture = (e) => {
    if (dragDistanceRef.current > 10) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  if (routines.length === 0) {
    return null;
  }

  return (
    <section aria-label="Tus rutinas" className="relative">
      {/* Header bar with counter, add routine button and view all */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal2">
            Tus Rutinas
          </p>
          <span className="font-mono-digit rounded-md bg-white/10 px-2 py-0.5 text-xs text-white">
            {routines.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/rutinas/nueva"
            className="flex h-7 items-center gap-1 rounded-full border border-teal/40 bg-teal/10 px-2.5 text-xs font-semibold text-teal2 transition hover:border-teal hover:bg-teal/20"
          >
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            <span>Nueva</span>
          </Link>

          <Link
            href="/rutinas"
            className="text-xs font-medium text-faint transition hover:text-white"
          >
            Ver todas
          </Link>
        </div>
      </div>

      {/* Desktop Web Layout: Clean 2-column Grid */}
      <div className="hidden sm:grid sm:grid-cols-2 gap-4">
        {routines.map((routine, index) => (
          <RoutineCardItem
            key={routine.id}
            routine={routine}
            index={index}
            totalRoutines={routines.length}
            isDesktop={true}
          />
        ))}
        <AddRoutineCardItem isDesktop={true} highlighted={addHighlighted} />
      </div>

      {/* Mobile Layout: Horizontal Swipe Carousel */}
      <div className="sm:hidden">
        <div
          ref={trackRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          onClickCapture={handleCardClickCapture}
          className={`-mx-[18px] flex gap-3.5 overflow-x-auto px-[18px] py-1 scrollbar-none snap-x snap-mandatory scroll-smooth overscroll-x-contain ${
            isDragging ? "cursor-grabbing select-none" : "cursor-grab"
          }`}
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {routines.map((routine, index) => (
            <RoutineCardItem
              key={routine.id}
              routine={routine}
              index={index}
              totalRoutines={routines.length}
              isDesktop={false}
            />
          ))}
          <AddRoutineCardItem isDesktop={false} highlighted={addHighlighted} />
        </div>

        {/* Mobile Pagination Dots */}
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {Array.from({ length: totalSlides }).map((_, idx) => {
            const isAddSlide = idx === routines.length;
            const isActive = activeIndex === idx;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => scrollToIndex(idx)}
                aria-label={`Ir a la tarjeta ${idx + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  isActive
                    ? isAddSlide
                      ? "w-6 bg-teal2"
                      : "w-6 bg-white"
                    : isAddSlide
                    ? "w-2 bg-teal/40 hover:bg-teal/70"
                    : "w-2 bg-white/25 hover:bg-white/50"
                }`}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
