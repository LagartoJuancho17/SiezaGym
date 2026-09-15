import Link from "next/link";
import { ChevronRightIcon, WeightIcon } from "./Icons";

/**
 * Ficha de rutina. Misma anatomia que la fila de actividad de la portada:
 * disco a la izquierda, nombre y datos al medio, avance a la derecha.
 */
export default function RoutineCard({ routine }) {
  const exercises = routine.exerciseCount;
  const meta = [
    `${exercises} ${exercises === 1 ? "ejercicio" : "ejercicios"}`,
    `${routine.totalSets} ${routine.totalSets === 1 ? "serie" : "series"}`,
    `${routine.estimatedMinutes} min`,
  ].join(" · ");

  return (
    <Link href={`/rutinas/${routine.id}`} className="d2-glass d2-routine-row">
      <span className="d2-orb d2-routine-icon">
        <WeightIcon size={26} width={1.5} />
      </span>

      <span className="d2-routine-body">
        <span className="d2-routine-name">
          <span>{routine.name}</span>
          {routine.isAssigned && <span className="d2-routine-tag">Del coach</span>}
        </span>
        <span className="d2-routine-meta">{meta}</span>
      </span>

      <ChevronRightIcon size={16} width={1.8} className="d2-routine-go" />
    </Link>
  );
}
