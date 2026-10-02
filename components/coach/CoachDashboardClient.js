"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import CoachPageShell from "@/components/coach/CoachPageShell";
import AddStudentModal from "@/components/coach/AddStudentModal";
import StudentList from "@/components/coach/StudentList";

function formatActivityDate(iso) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}

function formatActivityDuration(totalSec) {
  const mins = Math.round(totalSec / 60);
  return mins < 1 ? "<1 min" : `${mins} min`;
}

export default function CoachDashboardClient({ students, profile, summary, recentActivity = [] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const firstName = profile?.displayName?.trim().split(/\s+/)[0] || "Entrenador";
  const linkedStudents = summary?.linkedStudents ?? students.length;
  const assignedPlans = summary?.assignedPlans ?? 0;
  const studentsWithActivity = summary?.studentsWithActivity ?? 0;
  const studentsWithPlans = summary?.studentsWithPlans ?? 0;
  const planCoveragePct = summary?.planCoveragePct ?? 0;
  const filteredStudents = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es-AR");
    return query
      ? students.filter((student) => `${student.displayName || ""} ${student.email || ""}`.toLocaleLowerCase("es-AR").includes(query))
      : students;
  }, [students, search]);

  return (
    <CoachPageShell title="Panel del entrenador" backHref="/?view=athlete" backLabel="Ver Home de atleta">
      <div className="d2-coach-dashboard">
        <section className="d2-coach-welcome" aria-label="Bienvenida">
          <div>
            <p className="d2-coach-welcome-name">Hola, {firstName}</p>
            <p className="d2-coach-welcome-copy">Tu equipo y sus entrenamientos, en un solo lugar.</p>
          </div>
          <button type="button" onClick={() => setModalOpen(true)} className="d2-coach-primary-action">
            <span aria-hidden="true">+</span> Agregar alumno
          </button>
        </section>

        <section className="d2-coach-kpis" aria-label="Resumen del equipo">
          <div className="d2-coach-kpi"><span>Alumnos vinculados</span><strong>{linkedStudents}</strong><small>En tu equipo</small></div>
          <div className="d2-coach-kpi"><span>Planes asignados</span><strong>{assignedPlans}</strong><small>Rutinas en seguimiento</small></div>
          <div className="d2-coach-kpi"><span>Con actividad registrada</span><strong>{studentsWithActivity}</strong><small>En planes asignados</small></div>
        </section>

        <div className="d2-coach-main-grid">
          <section id="alumnos" className="d2-coach-panel d2-coach-roster" aria-labelledby="coach-students-title">
            <div className="d2-coach-panel-head">
              <div><h2 id="coach-students-title">Alumnos</h2><p>Accedé al plan y al progreso de cada persona.</p></div>
              <span className="d2-coach-counter">{filteredStudents.length} / {students.length}</span>
            </div>
            {students.length > 0 && (
              <label className="d2-coach-search">
                <span className="sr-only">Buscar alumno por nombre o correo</span>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></svg>
                <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre o correo" />
              </label>
            )}
            {search && filteredStudents.length === 0 ? (
              <div className="d2-coach-search-empty" role="status">No encontramos alumnos para “{search}”. Probá otro nombre o correo.</div>
            ) : (
              <StudentList students={filteredStudents} onOpenAdd={() => setModalOpen(true)} plansByStudent={summary?.plansByStudent} />
            )}
          </section>

          <div className="d2-coach-side-stack">
            <section className="d2-coach-panel d2-coach-coverage" aria-labelledby="coach-coverage-title">
              <div className="d2-coach-panel-head"><div><h2 id="coach-coverage-title">Cobertura de planes</h2><p>Alumnos con una rutina asignada.</p></div></div>
              <div className="d2-coach-coverage-value"><strong>{studentsWithPlans}</strong><span>de {linkedStudents} alumnos</span></div>
              <div className="d2-coach-coverage-track" role="meter" aria-label="Cobertura de planes" aria-valuemin="0" aria-valuemax="100" aria-valuenow={planCoveragePct}>
                <span style={{ width: `${planCoveragePct}%` }} />
              </div>
              <p className="d2-coach-coverage-caption">{linkedStudents === 0 ? "Agregá tu primer alumno para empezar." : `${planCoveragePct}% del equipo tiene un plan.`}</p>
            </section>

            <section id="actividad" className="d2-coach-panel d2-coach-activity" aria-labelledby="coach-activity-title">
              <div className="d2-coach-panel-head"><div><h2 id="coach-activity-title">Actividad reciente</h2><p>Última sesión registrada por cada plan.</p></div></div>
              {recentActivity.length === 0 ? (
                <div className="d2-coach-activity-empty">Cuando un alumno complete una rutina asignada, la verás acá.</div>
              ) : (
                <ol className="d2-coach-activity-list">
                  {recentActivity.map((activity) => (
                    <li key={activity.id}>
                      {activity.studentId ? (
                        <Link href={`/dashboard/coach/alumnos/${activity.studentId}`} className="d2-coach-activity-link">
                          <span className="d2-coach-activity-dot" aria-hidden="true" />
                          <span className="d2-coach-activity-copy"><strong>{activity.studentName}</strong><span>{activity.routineName}</span><small>{formatActivityDate(activity.completedAt)}</small></span>
                          <span className="d2-coach-duration">{formatActivityDuration(activity.durationSeconds)}</span>
                        </Link>
                      ) : (
                        <div className="d2-coach-activity-link"><span className="d2-coach-activity-dot" aria-hidden="true" /><span className="d2-coach-activity-copy"><strong>{activity.studentName}</strong><span>{activity.routineName}</span><small>{formatActivityDate(activity.completedAt)}</small></span><span className="d2-coach-duration">{formatActivityDuration(activity.durationSeconds)}</span></div>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        </div>
      </div>
      <AddStudentModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </CoachPageShell>
  );
}
