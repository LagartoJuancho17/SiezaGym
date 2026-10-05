"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

/**
 * Dibuja un modal fuera de la tarjeta donde se abrió.
 *
 * Las tarjetas de vidrio (`.d2-panel`) usan `backdrop-filter`, y un ancestro
 * con filtro pasa a ser el contenedor de `position: fixed`: el modal quedaba
 * atado a la tarjeta en vez de a la pantalla (corrido, cortado, sin tapar
 * todo). Se monta en la raíz `.d2` del tema, no en `body`, para seguir
 * heredando los colores del tema elegido.
 */
const noSubscribe = () => () => {};

export default function ModalPortal({ children }) {
  // En el servidor no hay document: false ahí, true en el cliente, sin un
  // setState en un efecto.
  const onClient = useSyncExternalStore(noSubscribe, () => true, () => false);
  if (!onClient) return null;
  return createPortal(children, document.querySelector(".d2") || document.body);
}
