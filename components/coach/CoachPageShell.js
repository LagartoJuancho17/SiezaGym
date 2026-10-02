import Link from "next/link";
import PageShell from "@/components/design2/PageShell";
import "./coach-workspace.css";

const NAV = [
  { href: "/dashboard/coach", label: "Resumen", key: "overview" },
  { href: "/dashboard/coach#alumnos", label: "Alumnos", key: "students" },
  { href: "/dashboard/coach#actividad", label: "Actividad", key: "activity" },
  { href: "/rutinas", label: "Rutinas", key: "routines" },
];

function ExternalArrow() {
  return <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12 12 4M6 4h6v6" /></svg>;
}

function CoachNavigation({ active }) {
  return (
    <aside className="d2-coach-sidebar" aria-label="Espacio del entrenador">
      <Link href="/" className="d2-coach-brand" aria-label="SiezaGym, ir al inicio">
        <span className="d2-coach-brand-mark" aria-hidden="true">S</span>
        <span>SIEZA<span className="d2-coach-brand-gym">GYM</span></span>
      </Link>
      <div className="d2-coach-sidebar-caption">ESPACIO ENTRENADOR</div>
      <nav aria-label="Navegación del entrenador" className="d2-coach-sidebar-nav">
        {NAV.map(({ href, label, key }) => (
          <Link key={key} href={href} aria-current={active === key ? "page" : undefined} className={`d2-coach-nav-link${active === key ? " is-active" : ""}`}>
            <span>{label}</span>
            <span className="d2-coach-nav-arrow"><ExternalArrow /></span>
          </Link>
        ))}
      </nav>
      <Link href="/?view=athlete" className="d2-coach-back-app">Ver Home de atleta <ExternalArrow /></Link>
    </aside>
  );
}

export default function CoachPageShell({ title, backHref, backLabel, active = "overview", children }) {
  return (
    <PageShell
      title={title}
      backHref={backHref}
      backLabel={backLabel}
      forcedTheme="sieza"
      shellClassName="d2-coach-root"
      pageClassName="d2-coach-page"
      sidebar={<CoachNavigation active={active} />}
      hideTabBar
    >
      {children}
    </PageShell>
  );
}
