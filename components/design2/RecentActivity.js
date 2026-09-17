import Link from "next/link";
import { WeightIcon } from "./Icons";

/**
 * Las ultimas sesiones registradas.
 *
 * Es un componente de servidor: sin buscador no hay estado que manejar, asi que
 * esta seccion ya no manda JavaScript al cliente. El historial completo, con su
 * propia busqueda, esta en /historial.
 */
export default function RecentActivity({ activities, limit = 2 }) {
  // El corte vive aca y no en quien llama: la portada muestra las ultimas dos
  // y el resto esta en /historial. Antes lo hacia la funcion del buscador.
  const shown = activities.slice(0, limit);

  return (
    <section className="d2-activity" aria-labelledby="d2-activity">
      <div className="d2-section-heading">
        <h2 id="d2-activity">Actividad reciente</h2>
        <Link href="/historial">Ver todo</Link>
      </div>

      {shown.length === 0 ? (
        <p className="d2-glass d2-activity-empty">Todavía no registraste entrenamientos.</p>
      ) : (
        <ul className="d2-activity-list">
          {shown.map((activity) => (
            <li key={activity.id}>
              <Link href={`/historial/${activity.id}`} className="d2-glass d2-activity-row">
                <span className="d2-orb d2-activity-icon">
                  <WeightIcon size={26} width={1.5} />
                </span>

                <span className="d2-activity-description">
                  <span className="d2-activity-name">{activity.name}</span>
                  <span className="d2-activity-secondary">{activity.when}</span>
                </span>

                <span className="d2-activity-metrics">
                  <span className="d2-activity-volume">{activity.volume}</span>
                  <span className="d2-activity-secondary">{activity.duration}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
