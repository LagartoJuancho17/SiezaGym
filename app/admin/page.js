import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { isAdminUser, ADMIN_EMAILS } from "@/lib/admin/access";
import { formatAdminDate, formatDuration, getAdminDashboardData } from "@/lib/admin/dashboard";
import { logout } from "@/app/dashboard/actions";
import "./admin.css";

export const dynamic = "force-dynamic";

const navItems = [
  ["overview", "Resumen"],
  ["users", "Usuarios"],
  ["coaches", "Entrenadores"],
  ["routines", "Rutinas"],
  ["catalog", "Ejercicios"],
  ["sessions", "Sesiones"],
  ["security", "Seguridad"],
];

function Metric({ label, value, detail, tone = "default" }) {
  return (
    <article className={`admin-metric admin-tone-${tone}`}>
      <span className="admin-muted">{label}</span>
      <strong>{value}</strong>
      <span className="admin-metric-detail">{detail}</span>
    </article>
  );
}

function SectionHeading({ id, title, detail }) {
  return (
    <div className="admin-section-heading">
      <div>
        <h2 id={id}>{title}</h2>
        <p>{detail}</p>
      </div>
    </div>
  );
}

function EmptyTable({ children }) {
  return <p className="admin-empty">{children}</p>;
}

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isAdminUser(user)) redirect("/");

  const data = await getAdminDashboardData();
  const { metrics } = data;

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/" className="admin-brand" aria-label="Volver a SiezaGym">
          <span className="admin-brand-mark">S</span>
          <span>SiezaGym<span> / admin</span></span>
        </Link>
        <p className="admin-sidebar-label">Operación</p>
        <nav aria-label="Secciones de administración" className="admin-nav">
          {navItems.map(([id, label], index) => (
            <a href={`#${id}`} key={id} className={index === 0 ? "is-current" : ""}>
              <span className="admin-nav-index">{String(index + 1).padStart(2, "0")}</span>
              {label}
            </a>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <span className="admin-status-dot" aria-hidden="true" />
          <span>Sesión de {user.email}</span>
          <Link href="/dashboard">Volver a mi dashboard</Link>
          <form action={logout}>
            <button type="submit">Cerrar sesión</button>
          </form>
        </div>
      </aside>

      <div className="admin-content">
        <header className="admin-header" id="overview">
          <div>
            <p className="admin-kicker">Centro de operaciones</p>
            <h1>Qué está pasando en SiezaGym</h1>
            <p className="admin-lede">
              Una lectura rápida de usuarios, entrenamientos y catálogo para detectar qué necesita atención.
            </p>
          </div>
          <div className="admin-header-meta">
            <span className="admin-live-pill"><span aria-hidden="true" /> Datos en vivo</span>
            <span>Actualizado {formatAdminDate(data.generatedAt)}</span>
          </div>
        </header>

        <section className="admin-metric-grid" aria-label="Resumen de métricas">
          <Metric label="Usuarios" value={metrics.userCount} detail={`+${metrics.newUsers30} en los últimos 30 días`} tone="accent" />
          <Metric label="Activos" value={metrics.activeUsers30} detail="Con acceso en los últimos 30 días" />
          <Metric label="Sesiones" value={metrics.sessionCount7} detail={`${metrics.sessionCount30} en los últimos 30 días`} />
          <Metric label="Entrenadores" value={metrics.coachCount} detail={`${metrics.assignmentCount} asignaciones activas`} />
        </section>

        <section className="admin-attention" aria-labelledby="attention-title">
          <div>
            <p className="admin-kicker">Necesita atención</p>
            <h2 id="attention-title">Tres señales para mirar hoy</h2>
          </div>
          <div className="admin-attention-list">
            <div><strong>{metrics.inactiveUsers30}</strong><span>usuarios sin actividad en 30 días</span></div>
            <div><strong>{metrics.missingMediaCount}</strong><span>ejercicios sin GIF o imagen</span></div>
            <div><strong>{metrics.customExerciseCount}</strong><span>ejercicios personalizados creados</span></div>
          </div>
        </section>

        <section className="admin-section" id="users" aria-labelledby="users-title">
          <SectionHeading id="users-title" title="Usuarios" detail="Las cuentas incorporadas más recientemente y su última actividad." />
          <div className="admin-table-wrap">
            {data.recentUsers.length === 0 ? <EmptyTable>Todavía no hay usuarios registrados.</EmptyTable> : (
              <table className="admin-table">
                <thead><tr><th>Usuario</th><th>Rol</th><th>Alta</th><th>Último acceso</th></tr></thead>
                <tbody>{data.recentUsers.map((item) => (
                  <tr key={item.uid}>
                    <td><strong>{item.displayName}</strong><span>{item.email || "Sin email"}</span></td>
                    <td><span className="admin-tag">{item.isAdmin ? "Admin" : item.isCoach ? "Entrenador" : "Atleta"}</span></td>
                    <td>{formatAdminDate(item.createdAt)}</td>
                    <td>{formatAdminDate(item.lastLoginAt)}</td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>
        </section>

        <div className="admin-two-col">
          <section className="admin-section" id="coaches" aria-labelledby="coaches-title">
            <SectionHeading id="coaches-title" title="Entrenadores" detail="Quién acompaña a la comunidad." />
            <div className="admin-list">
              {data.recentCoaches.length === 0 ? <EmptyTable>No hay entrenadores registrados.</EmptyTable> : data.recentCoaches.map((coach) => (
                <div className="admin-list-row" key={coach.uid}>
                  <div><strong>{coach.displayName}</strong><span>{coach.email || "Sin email"}</span></div>
                  <span className="admin-tag admin-tag-warm">Activo</span>
                </div>
              ))}
            </div>
          </section>

          <section className="admin-section" id="routines" aria-labelledby="routines-title">
            <SectionHeading id="routines-title" title="Rutinas" detail={`${metrics.routineCount} personales · ${metrics.templateCount} plantillas`} />
            <div className="admin-list">
              {data.recentRoutines.length === 0 ? <EmptyTable>No hay rutinas todavía.</EmptyTable> : data.recentRoutines.map((routine) => (
                <div className="admin-list-row" key={`${routine.kind}-${routine.id}`}>
                  <div><strong>{routine.name}</strong><span>{routine.exerciseCount} ejercicios · {routine.kind}</span></div>
                  <span className="admin-list-date">{formatAdminDate(routine.updatedAt)}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="admin-section" id="catalog" aria-labelledby="catalog-title">
          <SectionHeading id="catalog-title" title="Catálogo de ejercicios" detail="Salud del contenido que aparece al crear una rutina." />
          <div className="admin-catalog-grid">
            <div className="admin-catalog-health"><span className="admin-health-ring" aria-hidden="true" /><div><strong>{data.catalogHealth.withMedia} / {data.catalogHealth.total}</strong><span>con GIF o imagen</span></div></div>
            <div className="admin-catalog-missing"><strong>{metrics.missingMediaCount ? "Revisar medios faltantes" : "Catálogo completo"}</strong><span>{metrics.missingMediaCount ? data.catalogHealth.missingMedia.map((exercise) => exercise.nameEs).join(" · ") : "Todos los ejercicios tienen material visual."}</span></div>
          </div>
        </section>

        <section className="admin-section" id="sessions" aria-labelledby="sessions-title">
          <SectionHeading id="sessions-title" title="Sesiones recientes" detail="Actividad real registrada desde la web y el teléfono." />
          <div className="admin-table-wrap">
            {data.recentSessions.length === 0 ? <EmptyTable>Todavía no hay sesiones registradas.</EmptyTable> : (
              <table className="admin-table">
                <thead><tr><th>Usuario</th><th>Rutina</th><th>Duración</th><th>Volumen</th><th>Fecha</th></tr></thead>
                <tbody>{data.recentSessions.map((session) => (
                  <tr key={session.id}><td><strong>{session.userName}</strong><span>{session.totalSetsCompleted} series</span></td><td>{session.routineName}</td><td>{formatDuration(session.durationSeconds)}</td><td>{session.totalVolumeKg.toLocaleString("es-AR")} kg</td><td>{formatAdminDate(session.finishedAt)}</td></tr>
                ))}</tbody>
              </table>
            )}
          </div>
        </section>

        <section className="admin-section" id="security" aria-labelledby="security-title">
          <SectionHeading id="security-title" title="Seguridad" detail="Acceso administrativo restringido por email verificado en el servidor." />
          <div className="admin-security-box">
            <div><span className="admin-security-label">Administradores permitidos</span>{ADMIN_EMAILS.map((email) => <strong key={email}>{email}</strong>)}</div>
            <p>El panel no permite mutaciones globales todavía. Las acciones de usuarios y roles se agregan después de incorporar auditoría y confirmaciones.</p>
          </div>
        </section>

        <footer className="admin-footer">SiezaGym Admin · lectura operativa · {new Date().getFullYear()}</footer>
      </div>
    </main>
  );
}
