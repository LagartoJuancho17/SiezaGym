import { redirect } from "next/navigation";
import Link from "next/link";
import PageShell from "@/components/design2/PageShell";
import { logout } from "./actions";
import { getCurrentUser } from "@/lib/firebase/session";
import { getUserProfile } from "@/lib/users/users";
import { listUserItems } from "@/lib/items/items";
import "@/components/items/items-design2.css";
import DashboardMetrics from "@/components/dashboard/DashboardMetrics";
import { listUserSessions, listTrainedDates } from "@/lib/sessions/sessions";
import { listExercises } from "@/lib/exercises/exercises";

export const dynamic = "force-dynamic";

const destinations = [
  ["/", "Entrenamiento", "Tu actividad y la rutina de hoy"],
  ["/rutinas", "Rutinas", "Organizá tu próximo entrenamiento"],
  ["/historial", "Historial", "Volvé a tus sesiones anteriores"],
  ["/progreso", "Progreso", "Seguí tu evolución, ejercicio a ejercicio"],
  ["/perfil", "Perfil", "Tus datos, objetivos y preferencias"],
];

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [items, profile, sessions, trainedDates, exercises] = await Promise.all([
    listUserItems(user.uid), getUserProfile(user.uid),
    listUserSessions(user.uid, { limitCount: 50 }), listTrainedDates(user.uid), listExercises(),
  ]);
  const links = [...destinations];
  if (profile?.isCoach || profile?.isAdmin) {
    links.push(["/dashboard/coach", "Profesores", "Alumnos, rutinas asignadas y seguimiento"]);
  }

  return (
    <PageShell title="Tu espacio" eyebrow="Dashboard" backHref="/" backLabel="Inicio">
      <section className="d2-glass d2-items-intro" aria-label="Tu cuenta">
        <h2>{profile?.displayName || "Bienvenido a SiezaGym"}</h2>
        <p>{user.email || "Tu entrenamiento, en un solo lugar."}</p>
      </section>
      <DashboardMetrics sessions={sessions} trainedDates={trainedDates} exercises={exercises} profile={profile} now={new Date()} />
      <section className="d2-routine-section" aria-label="Accesos">
        <div className="d2-routine-list">
          {links.map(([href, title, description]) => (
            <Link href={href} className="d2-routine" key={href}>
              <div className="d2-routine-body">
                <h2 className="d2-routine-name">{title}</h2>
                <p className="d2-routine-meta">{description}</p>
              </div>
              <span aria-hidden="true" className="d2-routine-go">↗</span>
            </Link>
          ))}
          <Link href="/dashboard/items" className="d2-routine">
            <div className="d2-routine-body">
              <h2 className="d2-routine-name">Mis items</h2>
              <p className="d2-routine-meta">{items.length} guardados · Creá, editá y organizá tus items</p>
            </div>
            <span aria-hidden="true" className="d2-routine-go">↗</span>
          </Link>
        </div>
      </section>
      <form action={logout} className="d2-items-logout">
        <button className="d2-items-button" type="submit">Cerrar sesión</button>
      </form>
    </PageShell>
  );
}
