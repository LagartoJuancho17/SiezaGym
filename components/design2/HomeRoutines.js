import Link from "next/link";
import { ChevronRightIcon, PlusIcon } from "./Icons";

/**
 * Las rutinas en la portada.
 *
 * Muestra las rutinas del atleta en la Home en lugar de la actividad reciente,
 * con acceso directo al detalle de cada una y enlace a /rutinas.
 * Componente de servidor: sin buscador local, liviano y sin JavaScript innecesario.
 */
export default function HomeRoutines({ routines = [], limit = 4 }) {
  const shown = routines.slice(0, limit);

  return (
    <section className="d2-home-routines" aria-labelledby="d2-home-routines-title">
      <div className="d2-section-heading">
        <h2 id="d2-home-routines-title">Las rutinas</h2>
        <Link href="/rutinas">Ver todo</Link>
      </div>

      {shown.length === 0 ? (
        <div className="d2-glass d2-activity-empty">
          <p>Todavía no tenés rutinas.</p>
          <Link href="/rutinas/nueva" className="d2-empty-action" style={{ marginTop: "14px" }}>
            <PlusIcon size={16} width={2} />
            Crear la primera
          </Link>
        </div>
      ) : (
        <div className="d2-routine-list">
          {shown.map((routine) => {
            const exercises = routine.exerciseCount ?? routine.exercises?.length ?? 0;
            const sets = routine.totalSets ?? 0;
            const mins = routine.estimatedMinutes ?? 0;
            const meta =
              routine.meta ||
              [
                `${exercises} ${exercises === 1 ? "ejercicio" : "ejercicios"}`,
                `${sets} ${sets === 1 ? "serie" : "series"}`,
                `${mins} min`,
              ].join(" · ");

            return (
              <Link
                key={routine.key || routine.id}
                href={`/rutinas/${routine.id}`}
                className="d2-routine"
              >
                <span className="d2-routine-body">
                  <span className="d2-routine-name">
                    <span>{routine.name}</span>
                    {routine.isAssigned && <span className="d2-routine-tag">Del coach</span>}
                  </span>
                  <span className="d2-routine-meta">{meta}</span>
                </span>
                <ChevronRightIcon size={16} width={1.6} className="d2-routine-go" />
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
