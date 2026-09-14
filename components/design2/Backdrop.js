/**
 * Fondo del rediseño: degradado con manchas desenfocadas y grano encima.
 *
 * Las manchas no son decoración: el vidrio de las tarjetas difumina lo que
 * tiene atrás, y sobre un color plano el backdrop-filter no se percibe. El
 * grano rompe las bandas del degradado, que en los temas oscuros se notan.
 *
 * Los colores y el desenfoque salen del tema (ver app/design2.css).
 */
export default function Backdrop() {
  return (
    <div aria-hidden className="d2-backdrop fixed inset-0 -z-10 overflow-hidden">
      <div
        className="d2-blob"
        style={{ width: 460, height: 460, left: "-14%", top: "6%", background: "var(--d2-blob-1)" }}
      />
      <div
        className="d2-blob"
        style={{ width: 380, height: 380, right: "-16%", top: "26%", background: "var(--d2-blob-2)" }}
      />
      <div
        className="d2-blob"
        style={{ width: 520, height: 520, left: "24%", bottom: "-22%", background: "var(--d2-blob-3)" }}
      />
      <div className="d2-noise" />
    </div>
  );
}
