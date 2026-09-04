"use client";

import Image from "next/image";
import Link from "next/link";
import AccountMenu from "@/components/home/AccountMenu";

const DAYS_SHORT = [
  { label: "M", full: "Lun" },
  { label: "T", full: "Mar" },
  { label: "W", full: "Mié" },
  { label: "T", full: "Jue" },
  { label: "F", full: "Vie" },
  { label: "S", full: "Sáb" },
  { label: "S", full: "Dom" },
];

export default function HomeHero({
  routineId = null,
  routineName = "Tu rutina",
  volumeKg = 2040,
  setsLeft = 9,
  primaryMuscle = "Piernas",
  secondaryMuscle = "Espalda",
  accountInitial = "T",
  accountPhotoURL = null,
  accountEmail = null,
}) {
  const currentDayIndex = (new Date().getDay() + 6) % 7; // Monday = 0

  return (
    <div className="relative w-full overflow-hidden bg-[#2D0608] min-h-[380px] sm:min-h-[440px] lg:h-[48vh] lg:min-h-[460px] flex flex-col justify-between">
      {/* Background Photography: Dumbbells on Red Gym Rubber Floor */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero-gym.jpg"
          alt="Athletic Gym Dumbbells on Red Turf"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Subtle contrast gradient on left & bottom for legibility while keeping floor bright red */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(100deg, rgba(20, 2, 4, 0.78) 0%, rgba(20, 2, 4, 0.45) 45%, rgba(20, 2, 4, 0.15) 80%, rgba(20, 2, 4, 0.5) 100%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(30, 4, 6, 0.7) 0%, transparent 40%)",
          }}
        />
      </div>

      {/* Mobile Top Header: 4 Icons in frosted container matching Image 2 */}
      <div className="relative z-20 flex items-center justify-end p-4 md:hidden">
        <div className="flex items-center gap-1 rounded-2xl border border-white/20 bg-black/45 p-1 backdrop-blur-xl shadow-lg">
          {/* 1. Device */}
          <Link
            href="/rutinas"
            aria-label="Dispositivo"
            className="flex h-8 w-8 items-center justify-center rounded-xl text-white/80"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="7" y="4" width="10" height="16" rx="2" />
              <path d="M9 2h6M9 22h6" />
            </svg>
          </Link>
          {/* 2. Bell */}
          <button
            type="button"
            aria-label="Notificaciones"
            className="relative flex h-8 w-8 items-center justify-center rounded-xl text-white/80"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[#FF5733]" />
          </button>
          {/* 3. Avatar */}
          <div className="[&_button]:h-8 [&_button]:w-8 [&_button]:border-transparent [&_button]:bg-white/15 [&_button]:text-white">
            <AccountMenu
              initial={accountInitial}
              photoURL={accountPhotoURL}
              email={accountEmail}
              size="sm"
              variant="hero"
            />
          </div>
          {/* 4. Settings */}
          <Link
            href="/perfil"
            aria-label="Ajustes"
            className="flex h-8 w-8 items-center justify-center rounded-xl text-white/80"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Desktop spacer for the top floating nav */}
      <div className="hidden h-16 md:block" />

      {/* Hero Body Content */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1360px] flex-1 items-end justify-between px-5 pb-8 sm:px-8">
        {/* Left Typography matching Image 1 & 2 */}
        <div className="max-w-xl pb-2">
          <h1 className="font-sans text-4xl font-black uppercase tracking-tight text-white sm:text-5xl lg:text-[54px] lg:leading-none">
            GO TIME!
          </h1>
          <h2 className="mt-1 font-sans text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[38px] lg:leading-tight">
            {routineName}
          </h2>
          <p className="mt-3 max-w-lg text-[13px] leading-relaxed text-white/90 sm:text-sm">
            Incredible volume and intensity today! You&apos;ve powered through {volumeKg.toLocaleString()} kg. Your body is focused and ready to maintain high intensity for the final {setsLeft} sets.
          </p>
        </div>

        {/* Right Frosted Widget matching Image 1 (Desktop only) */}
        <div className="hidden flex-col gap-4 rounded-2xl border border-white/15 bg-black/45 p-4 backdrop-blur-xl shadow-2xl md:flex md:w-[290px] lg:w-[320px]">
          {/* Weekday Strip */}
          <div className="flex items-center justify-between gap-1">
            {DAYS_SHORT.map((day, idx) => {
              const isToday = idx === currentDayIndex;
              return (
                <div
                  key={idx}
                  className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold transition-all ${
                    isToday
                      ? "bg-white text-[#141414] shadow-sm"
                      : "bg-white/10 text-white/80"
                  }`}
                >
                  {day.label}
                </div>
              );
            })}
          </div>

          {/* Dual Muscle Progress Rings */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* 1. Leg Muscles (40%) */}
            <div className="flex flex-col items-center text-center">
              <span className="text-[11px] font-semibold text-white/85">
                {primaryMuscle}
              </span>
              <div className="relative my-2 flex h-20 w-20 items-center justify-center">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.15)"
                    strokeWidth="2.5"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    stroke="#FF5733"
                    strokeWidth="2.5"
                    strokeDasharray="94.2"
                    strokeDashoffset={94.2 * (1 - 0.4)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="font-sans text-sm font-extrabold text-white">
                    40%
                  </span>
                  <span className="text-[9px] text-white/70">
                    {setsLeft} Sets Left
                  </span>
                </div>
              </div>
              <Link
                href={routineId ? `/rutinas/${routineId}` : "/rutinas"}
                className="text-[11px] font-semibold text-white transition hover:text-[#FF7352]"
              >
                Continue Workout &gt;
              </Link>
            </div>

            {/* 2. Back Muscles (100%) */}
            <div className="flex flex-col items-center text-center">
              <span className="text-[11px] font-semibold text-white/85">
                {secondaryMuscle}
              </span>
              <div className="relative my-2 flex h-20 w-20 items-center justify-center">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.15)"
                    strokeWidth="2.5"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    stroke="#FF5733"
                    strokeWidth="2.5"
                    strokeDasharray="94.2"
                    strokeDashoffset={0}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="font-sans text-sm font-extrabold text-white">
                    100%
                  </span>
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white mt-0.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              </div>
              <span className="text-[11px] font-medium text-white/70">
                Well Done
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
