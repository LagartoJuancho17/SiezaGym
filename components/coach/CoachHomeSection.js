"use client";

import "./coach-design2.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AddStudentModal from "@/components/coach/AddStudentModal";
import StudentList from "@/components/coach/StudentList";

export default function CoachHomeSection({ students, isAdmin }) {
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 8000);
    return () => clearInterval(interval);
  }, [router]);

  return (
    <section aria-label="Panel del entrenador" className="d2-coach-stack">
      <div className="d2-section-heading">
        <h2>Tus alumnos</h2>
        {isAdmin && <span className="d2-coach-muted">Admin</span>}
      </div>
      <div className="d2-coach-summary">
        <div className="d2-glass d2-coach-stat"><span className="d2-coach-muted">Alumnos vinculados</span><strong>{students.length}</strong></div>
        <button type="button" onClick={() => setModalOpen(true)} className="d2-glass d2-coach-add"><span className="d2-coach-plus" aria-hidden="true">+</span>Agregar alumno</button>
      </div>
      <StudentList students={students} onOpenAdd={() => setModalOpen(true)} />
      <AddStudentModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </section>
  );
}
