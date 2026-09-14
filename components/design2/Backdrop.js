// Fondo del rediseño: gris frío con manchas desenfocadas por detrás.
//
// Las manchas no son decoración: el vidrio de las tarjetas difumina lo que
// tiene atrás, y sobre un color plano el backdrop-filter no se percibe. Son
// ellas las que hacen que el efecto se note.
export default function Backdrop() {
  return (
    <div aria-hidden className="d2-backdrop fixed inset-0 -z-10 overflow-hidden">
      <div
        className="d2-blob"
        style={{ width: 460, height: 460, left: "-14%", top: "6%", background: "rgba(122,131,145,0.55)" }}
      />
      <div
        className="d2-blob"
        style={{ width: 380, height: 380, right: "-16%", top: "26%", background: "rgba(232,236,241,0.6)" }}
      />
      <div
        className="d2-blob"
        style={{ width: 520, height: 520, left: "24%", bottom: "-22%", background: "rgba(104,112,126,0.5)" }}
      />
    </div>
  );
}
