"use client";

import { useCallback, useEffect, useRef } from "react";

/** Lo que tarda en abrirse. Menos se dispara solo al tocar; más se siente trabado. */
const HOLD_MS = 450;

/** Si el dedo se corre más que esto, era un scroll y no una pulsación. */
const MOVE_TOLERANCE_PX = 10;

/**
 * Mantener presionado para abrir algo.
 *
 * Devuelve las props para poner en el elemento. Escucha eventos de puntero, que
 * cubren dedo, mouse y lápiz con el mismo código, y cancela apenas el dedo se
 * corre: si no, arrastrar la lista para bajar abriría el menú.
 *
 * En una computadora el equivalente es el clic derecho, así que también escucha
 * el menú contextual. Con teclado no hay gesto posible: estas mismas acciones
 * viven en el menú «···» del detalle de la rutina, que sí se alcanza tabulando.
 */
export default function useHold(onHold, { enabled = true } = {}) {
  const timer = useRef(null);
  const origin = useRef(null);
  // Después de abrir por pulsación, el dedo al levantarse dispara un click.
  // Sin esta marca, ese click navega al detalle y el menú se ve un instante.
  const opened = useRef(false);

  const cancel = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    origin.current = null;
  }, []);

  useEffect(() => cancel, [cancel]);

  const fire = useCallback(
    (event) => {
      cancel();
      opened.current = true;
      // En Android confirma con el pulso que ya se abrió; en iOS no existe y
      // no pasa nada.
      navigator.vibrate?.(10);
      onHold(event);
    },
    [cancel, onHold],
  );

  if (!enabled) return {};

  return {
    onPointerDown(event) {
      // Solo el botón principal: el derecho ya abre por menú contextual.
      if (event.button !== 0) return;
      origin.current = { x: event.clientX, y: event.clientY };
      timer.current = setTimeout(() => fire(event), HOLD_MS);
    },

    onPointerMove(event) {
      if (!origin.current) return;
      const dx = Math.abs(event.clientX - origin.current.x);
      const dy = Math.abs(event.clientY - origin.current.y);
      if (dx > MOVE_TOLERANCE_PX || dy > MOVE_TOLERANCE_PX) cancel();
    },

    onPointerUp: cancel,
    // El navegador lo manda cuando decide que el gesto es un scroll.
    onPointerCancel: cancel,

    onContextMenu(event) {
      event.preventDefault();
      fire(event);
    },

    onClick(event) {
      if (!opened.current) return;
      opened.current = false;
      event.preventDefault();
    },
  };
}
