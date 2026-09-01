"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export default function RoutinesCarousel({ routines = [] }) {
  const trackRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [addHighlighted, setAddHighlighted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const dragDistanceRef = useRef(0);

  // Total slides = all routines + 1 "Agregar rutina extra" card
  const totalSlides = routines.length + 1;

  // Track active slide on scroll
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

  // Mouse drag support for desktop/trackpads
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
    // If the user was dragging significantly, prevent navigation
    if (dragDistanceRef.current > 10) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  if (routines.length === 0) {
    return null;
  }

  return (
    <section aria-label="Tus rutinas" className="relative mb-3">
      {/* Header bar with counter, add routine button and view all */}
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-white/60">
            {routines.length} {routines.length === 1 ? "rutina" : "rutinas"}
          </p>
          <span className="inline-block h-1 w-1 rounded-full bg-teal" />
          <span className="text-[10.5px] text-faint">
            Deslizá para ver más
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick animated button to scroll to and highlight add card */}
          <button
            type="button"
            onClick={handleTriggerAddAnimation}
            title="Agregar rutina extra"
            className="group relative flex h-7 items-center gap-1 rounded-full border border-teal/40 bg-teal/10 px-2.5 text-[11.5px] font-medium text-teal2 transition hover:border-teal hover:bg-teal/20 active:scale-95"
          >
            <svg
              viewBox="0 0 24 24"
              width="13"
              height="13"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              className="transition-transform duration-300 group-hover:rotate-90"
            >
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            <span>Nueva</span>
            <span className="absolute -inset-0.5 -z-10 rounded-full bg-teal/20 opacity-0 blur-sm transition-opacity group-hover:opacity-100" />
          </button>

          <Link
            href="/rutinas"
            className="text-[11.5px] font-medium text-faint transition hover:text-white"
          >
            Ver todas
          </Link>
        </div>
      </div>

      {/* Carousel Track with smooth prolonged horizontal scroll */}
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
          <article
            key={routine.id}
            className="group relative flex min-h-[300px] w-[84vw] max-w-[340px] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-[30px] border border-white/10 bg-deep px-[20px] py-[22px] transition-all duration-300 hover:border-white/20"
          >
            {/* Background Ambient Radial Glow */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{
                background:
                  index % 2 === 0
                    ? "radial-gradient(90% 70% at 20% 0%, rgba(63,169,188,0.32) 0%, transparent 70%)"
                    : "radial-gradient(90% 70% at 20% 0%, rgba(87,192,206,0.28) 0%, transparent 70%)",
              }}
            />

            {/* Top row: Badge and Order */}
            <div className="relative flex items-center justify-between">
              <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70">
                Rutina {index + 1} de {routines.length}
              </span>
              <span className="text-[11px] font-mono text-teal2">
                ~{routine.estimatedMinutes || 0} min
              </span>
            </div>

            {/* Center: Title and stats */}
            <div className="relative my-auto py-2">
              <h3 className="font-display line-clamp-2 text-[32px] uppercase leading-[0.96] tracking-[0.005em] text-white">
                {routine.name}
              </h3>
              <p className="mt-2 text-[12.5px] leading-[1.4] text-white/70">
                {routine.exercises?.length || 0} ejercicios · {routine.totalSets || 0} series
              </p>
            </div>

            {/* Bottom Actions */}
            <div className="relative mt-2 flex flex-col gap-2">
              <Link
                href={`/rutinas/${routine.id}`}
                className="flex h-[50px] w-full items-center justify-center gap-2 rounded-full bg-white text-[15.5px] font-semibold text-onlight shadow-md transition hover:opacity-90 active:scale-[0.98]"
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
              <Link
                href="/rutinas"
                className="flex h-10 w-full items-center justify-center rounded-full border border-white/20 text-[13.5px] font-medium text-white/80 transition hover:bg-white/10"
              >
                Ver todas
              </Link>
            </div>
          </article>
        ))}

        {/* Extra Card: Animated "Agregar rutina extra" Card */}
        <article
          className={`group relative flex min-h-[300px] w-[84vw] max-w-[340px] shrink-0 snap-start flex-col items-center justify-between overflow-hidden rounded-[30px] border-2 border-dashed border-teal/40 bg-deep/85 p-[22px] text-center transition-all duration-300 hover:border-teal hover:bg-deep ${
            addHighlighted ? "ring-4 ring-teal ring-offset-2 ring-offset-bg scale-[1.02] shadow-[0_0_35px_rgba(63,169,188,0.5)]" : ""
          }`}
        >
          {/* Animated Background Pulse Aura */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 animate-pulse opacity-40 transition-opacity group-hover:opacity-75"
            style={{
              background:
                "radial-gradient(circle at 50% 40%, rgba(63,169,188,0.35) 0%, transparent 65%)",
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
            {/* Animated floating & glowing plus icon */}
            <div className="relative mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-teal via-teal2 to-cyan-200 text-onlight shadow-[0_0_28px_rgba(63,169,188,0.45)] transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_40px_rgba(63,169,188,0.7)] group-active:scale-95">
              <svg
                viewBox="0 0 24 24"
                width="28"
                height="28"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                className="transition-transform duration-500 group-hover:rotate-90"
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
            </div>

            <h3 className="font-display text-[26px] uppercase leading-[1] tracking-[0.01em] text-white">
              Nueva rutina
            </h3>
            <p className="mt-2 max-w-[230px] text-[12px] leading-[1.4] text-white/70">
              Agregá una rutina extra para sumar otro día o variante a tu semana.
            </p>
          </div>

          {/* Bottom Action Button */}
          <div className="relative w-full">
            <Link
              href="/rutinas/nueva"
              className="flex h-[50px] w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-teal via-teal2 to-teal bg-[length:200%_auto] text-[15px] font-semibold text-onlight shadow-[0_4px_20px_rgba(63,169,188,0.35)] transition-all hover:bg-right active:scale-[0.98]"
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              Crear rutina extra
            </Link>
          </div>
        </article>
      </div>

      {/* Pagination Dots Indicator */}
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
    </section>
  );
}
