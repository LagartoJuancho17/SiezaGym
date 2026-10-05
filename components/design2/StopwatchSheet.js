"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import {
  STOPWATCH_IDLE,
  countdownRemainingMs,
  crossedTarget,
  formatStopwatch,
  isRunning,
  lapRows,
  loggedSeconds,
  progressToward,
  stopwatchElapsedMs,
  stopwatchReducer,
} from "@/lib/workout/stopwatch";
import { playRestCompleteSound, triggerHaptic } from "@/lib/audio/workoutSound";
import { CloseIcon } from "./Icons";
import ModalPortal from "./ModalPortal";

const RING_RADIUS = 46;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

/**
 * Cronómetro de una serie de tiempo, con la forma del reloj del iPhone:
 * dígitos grandes y finos, dos botones redondos (Vuelta/Reiniciar a la
 * izquierda, Iniciar/Detener a la derecha) y las vueltas abajo.
 *
 * Con un tiempo prescrito suma un anillo de progreso y el modo Temporizador,
 * que cuenta para atrás y suena al llegar a cero. Los dos modos comparten el
 * mismo estado: cambiar de uno a otro con el reloj andando no pierde nada.
 *
 * Al guardar devuelve segundos enteros; la planilla guarda eso.
 */
export default function StopwatchSheet({ exerciseName, setNumber, targetSeconds, currentSeconds, onSave, onClose }) {
  const hasTarget = Number(targetSeconds) > 0;
  const [mode, setMode] = useState("stopwatch");
  const [state, dispatch] = useReducer(stopwatchReducer, STOPWATCH_IDLE);
  const [now, setNow] = useState(0);
  const [manual, setManual] = useState(currentSeconds ?? "");
  const previousMs = useRef(0);
  const running = isRunning(state);
  const elapsed = stopwatchElapsedMs(state, now);

  // requestAnimationFrame y no setInterval: las centésimas tienen que moverse
  // parejas, y el tiempo se lee igual del reloj de pared en cada cuadro.
  useEffect(() => {
    if (!running) return undefined;
    let frame = requestAnimationFrame(function tick() {
      setNow(Date.now());
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [running]);

  // Llegar al objetivo suena una vez, en los dos modos.
  useEffect(() => {
    if (hasTarget && crossedTarget(targetSeconds, previousMs.current, elapsed)) {
      playRestCompleteSound();
      triggerHaptic([80, 60, 80, 60, 160]);
    }
    previousMs.current = elapsed;
  }, [elapsed, hasTarget, targetSeconds]);

  // Con el reloj andando la pantalla no se apaga: es una plancha, no se toca
  // el teléfono. Donde no hay Wake Lock (o se niega) sigue sin él.
  useEffect(() => {
    if (!running || typeof navigator === "undefined" || !navigator.wakeLock?.request) return undefined;
    let lock = null;
    let released = false;
    navigator.wakeLock
      .request("screen")
      .then((sentinel) => {
        if (released) sentinel.release().catch(() => {});
        else lock = sentinel;
      })
      .catch(() => {});
    return () => {
      released = true;
      lock?.release().catch(() => {});
    };
  }, [running]);

  const act = (type) => {
    const at = Date.now();
    dispatch({ type, now: at });
    setNow(at);
  };

  const timerMode = mode === "timer" && hasTarget;
  const shownMs = timerMode ? countdownRemainingMs(targetSeconds, elapsed) : elapsed;
  const reached = hasTarget && elapsed >= Number(targetSeconds) * 1000;
  const progress = hasTarget ? progressToward(targetSeconds, elapsed) : 0;
  const measured = elapsed > 0 ? loggedSeconds(mode, targetSeconds, elapsed) : null;
  const laps = lapRows(state.laps);
  const manualValue = manual === "" ? null : Number(manual);

  function save(markDone) {
    const seconds = measured ?? (manualValue > 0 ? Math.round(manualValue) : null);
    if (!seconds) return;
    onSave(seconds, { markDone });
  }

  const leftLabel = running ? "Vuelta" : elapsed > 0 ? "Reiniciar" : "Vuelta";
  const leftDisabled = !running && elapsed === 0;
  const rightLabel = running ? "Detener" : elapsed > 0 ? "Reanudar" : "Iniciar";

  return (
    <ModalPortal>
    <div
      className="d2-modal d2-sw-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`Cronómetro de ${exerciseName}, serie ${setNumber}`}
      // Un toque afuera con el reloj andando no puede tirar la medición.
      onClick={() => !running && onClose()}
    >
      <div className="d2-glass-strong d2-modal-card d2-sw" onClick={(event) => event.stopPropagation()}>
        <div className="d2-sw-head">
          <div>
            <p className="d2-sw-title">{exerciseName}</p>
            <p className="d2-sw-sub">
              Serie {setNumber}
              {hasTarget && ` · objetivo ${targetSeconds} s`}
            </p>
          </div>
          <button type="button" className="d2-media-close" onClick={onClose} aria-label="Cerrar cronómetro">
            <CloseIcon size={18} width={2} />
          </button>
        </div>

        {hasTarget && (
          <div className="d2-segs d2-sw-modes" role="tablist" aria-label="Modo">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "stopwatch"}
              className={`d2-seg ${mode === "stopwatch" ? "d2-seg-on" : ""}`}
              onClick={() => setMode("stopwatch")}
            >
              Cronómetro
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "timer"}
              className={`d2-seg ${mode === "timer" ? "d2-seg-on" : ""}`}
              onClick={() => setMode("timer")}
            >
              Temporizador
            </button>
          </div>
        )}

        <div className={`d2-sw-face ${reached ? "d2-sw-reached" : ""}`}>
          {hasTarget && (
            <svg className="d2-sw-ring" viewBox="0 0 100 100" aria-hidden="true">
              <circle cx="50" cy="50" r={RING_RADIUS} className="d2-sw-ring-track" />
              <circle
                cx="50"
                cy="50"
                r={RING_RADIUS}
                className="d2-sw-ring-fill"
                strokeDasharray={RING_LENGTH}
                // Cronómetro: el anillo se llena hacia el objetivo.
                // Temporizador: se vacía, como el del iPhone.
                strokeDashoffset={timerMode ? RING_LENGTH * progress : RING_LENGTH * (1 - progress)}
              />
            </svg>
          )}
          <span className="d2-sw-digits" aria-live="off" data-testid="sw-digits">
            {formatStopwatch(shownMs)}
          </span>
          {reached && <span className="d2-sw-done">¡Tiempo!</span>}
        </div>

        <div className="d2-sw-controls">
          <button
            type="button"
            className="d2-sw-round d2-sw-round-gray"
            disabled={leftDisabled}
            onClick={() => act(running ? "lap" : "reset")}
          >
            {leftLabel}
          </button>
          <button
            type="button"
            className={`d2-sw-round ${running ? "d2-sw-round-red" : "d2-sw-round-green"}`}
            onClick={() => act(running ? "stop" : "start")}
          >
            {rightLabel}
          </button>
        </div>

        {!timerMode && laps.length > 0 && (
          <ol className="d2-sw-laps" aria-label="Vueltas">
            {laps.map((lap) => (
              <li
                key={lap.number}
                className={lap.fastest ? "d2-sw-lap-fast" : lap.slowest ? "d2-sw-lap-slow" : undefined}
              >
                <span>Vuelta {lap.number}</span>
                <span>{formatStopwatch(lap.splitMs)}</span>
              </li>
            ))}
          </ol>
        )}

        {measured == null && (
          <label className="d2-sw-manual">
            <span>O escribí los segundos</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={3600}
              placeholder="—"
              value={manual ?? ""}
              onChange={(event) => setManual(event.target.value)}
            />
          </label>
        )}

        <div className="d2-modal-actions d2-sw-actions">
          <button
            type="button"
            className="d2-modal-primary"
            disabled={running || !(measured || manualValue > 0)}
            onClick={() => save(true)}
          >
            {measured ? `Guardar ${measured} s y marcar serie` : "Guardar y marcar serie"}
          </button>
          <button
            type="button"
            className="d2-modal-secondary"
            disabled={running || !(measured || manualValue > 0)}
            onClick={() => save(false)}
          >
            Solo guardar el tiempo
          </button>
        </div>
        {running && <p className="d2-sw-hint">Detené el reloj para guardar el tiempo.</p>}
      </div>
    </div>
    </ModalPortal>
  );
}
