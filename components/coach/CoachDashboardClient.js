"use client";

import { useState } from "react";
import PageShell from "@/components/design2/PageShell";
import "./coach-design2.css";
import AddStudentModal from "@/components/coach/AddStudentModal";
import StudentList from "@/components/coach/StudentList";

function formatActivityDate(iso) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatActivityDuration(totalSec) {
  const mins = Math.round(totalSec / 60);
  return mins < 1 ? "<1 min" : `${mins} min`;
}

export default function CoachDashboardClient({ students, profile, recentActivity = [] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const firstName =
    profile?.displayName?.trim().split(/\s+/)[0] || "Entrenador";

  return (
    <PageShell title={firstName} eyebrow={profile?.isCoach ? "Panel del entrenador" : "Panel del entrenador · vista admin"} backHref="/" backLabel="Volver al inicio">
      <div className="d2-coach-stack">
        <section className="d2-coach-summary" aria-label="Tus alumnos">
          <div className="d2-glass d2-coach-stat">
            <span className="d2-coach-muted">Alumnos vinculados</span>
            <strong>{students.length}</strong>
          </div>
          <button type="button" onClick={() => setModalOpen(true)} className="d2-glass d2-coach-add">
            <span aria-hidden="true" className="d2-coach-plus">+</span>
            Agregar alumno
          </button>
        </section>
        <StudentList students={students} onOpenAdd={() => setModalOpen(true)} />
        <section>
          <div className="d2-section-heading"><h2>Actividad reciente</h2></div>
          {recentActivity.length === 0 ? (
            <div className="d2-glass d2-empty">Las rutinas completadas por tus alumnos aparecerán acá.</div>
          ) : (
            <div className="d2-coach-stack d2-coach-section-body">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="d2-glass d2-coach-row">
                  <div className="d2-student-body">
                    <p className="d2-student-name">{activity.studentName}</p>
                    <p className="d2-student-mail">{activity.routineName} · {formatActivityDate(activity.completedAt)}</p>
                  </div>
                  <span className="d2-coach-value">{formatActivityDuration(activity.durationSeconds)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      <AddStudentModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </PageShell>
  );
}
