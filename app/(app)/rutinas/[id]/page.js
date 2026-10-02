import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { getUserProfile } from "@/lib/users/users";
import { getUserRoutine } from "@/lib/routines/routines";
import { getAssignment } from "@/lib/assignments/assignments";
import { listExercises } from "@/lib/exercises/exercises";
import { listCustomExercises } from "@/lib/customExercises/customExercises";
import { listCoachStudents } from "@/lib/coach/students";
import { listUserSessions } from "@/lib/sessions/sessions";
import { lastNotesByExercise } from "@/lib/sessions/notes";
import { EQUIPMENT_LABELS, isTimeBasedRegistration } from "@/lib/exercises/constants";
import { primaryMuscleLabel } from "@/lib/exercises/browse";
import { prescriptionSummary } from "@/lib/routines/prescription";
import { plannedSets } from "@/lib/routines/workout";
import { estimatedDurationMinutes, muscleDistribution, totalSets } from "@/lib/routines/summary";
import ThemeRoot from "@/components/design2/ThemeRoot";
import Backdrop from "@/components/design2/Backdrop";
import RoutineScreen from "@/components/design2/RoutineScreen";

export const dynamic = "force-dynamic";

/**
 * Lo que la pantalla dibuja de cada ejercicio, y nada más.
 *
 * Las series quedan abiertas en una sola forma (plannedSets) así el cliente no
 * vuelve a preguntar si la prescripción era pareja o serie por serie, y el
 * catálogo entero —94 ejercicios con descripciones largas en dos idiomas— no
 * viaja al navegador.
 */
function shapeExercise(item, position, lookup, lastNotes = {}) {
  const exercise = lookup.get(item.exerciseId);
  const timeBased = isTimeBasedRegistration(exercise?.registrationType);

  return {
    position,
    exerciseId: item.exerciseId,
    name: exercise?.nameEs || item.exerciseId,
    muscle: primaryMuscleLabel(exercise) || "Sin datos",
    mediaUrl: exercise?.mediaUrl || null,
    // Los ejercicios propios pueden traer un video de YouTube; se reproduce
    // embebido en la planilla (RoutineExercise), sin salir de la app.
    videoUrl: exercise?.videoUrl || null,
    description: exercise?.descriptionEs || "",
    timeBased,
    // El peso se pide solo donde tiene sentido: en peso corporal o en plancha no.
    showWeight: exercise?.registrationType === "peso_reps",
    equipment: EQUIPMENT_LABELS[exercise?.equipment] || null,
    techniqueNote: item.techniqueNote || "",
    // Lo último que se anotó entrenando este ejercicio, en cualquier rutina.
    lastNote: lastNotes[item.exerciseId] || null,
    group: item.group || "",
    groupColor: item.groupColor || "",
    summary: prescriptionSummary(item, { timeBased }),
    sets: plannedSets(item),
  };
}

function shapeRoutine(source, lookup, { isAssigned, assignmentId, readOnly, students, weekNumber, weekLabel, lastNotes }) {
  const exercises = (source.exercises || []).map((item, position) =>
    shapeExercise(item, position, lookup, lastNotes),
  );

  return {
    id: source.id,
    name: source.name,
    note: source.note || "",
    isAssigned,
    assignmentId,
    readOnly,
    weekNumber: weekNumber != null ? weekNumber : null,
    weekLabel: weekLabel || (weekNumber != null ? `Semana ${weekNumber}` : null),
    showOnHome: source.showOnHome !== false,
    students,
    exercises,
    totalSets: totalSets(source),
    estimatedMinutes: estimatedDurationMinutes(source, lookup),
    // El reparto sale de muscleWeights del catálogo, no de una estimación.
    muscles: muscleDistribution(source, lookup)
      .slice(0, 5)
      .map((row) => ({ muscle: row.muscle, percent: Math.round(row.pct * 100) })),
    // El crédito de Gym visual es de los GIF del catálogo. La miniatura de un
    // video de YouTube también llega como mediaUrl, pero no es de ellos.
    hasMedia: exercises.some((exercise) => exercise.mediaUrl && !exercise.videoUrl),
  };
}

export default async function RutinaDetallePage({ params }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const [routine, assignment, catalogExercises, customExercises, profile, recentSessions] = await Promise.all([
    getUserRoutine(user.uid, id),
    getAssignment(id),
    listExercises(),
    listCustomExercises(user.uid),
    getUserProfile(user.uid),
    // Una sola consulta para las notas de la última vez, en vez de una por
    // ejercicio. 30 sesiones son un par de meses de entrenar seguido.
    listUserSessions(user.uid, { limitCount: 30 }),
  ]);
  const lastNotes = lastNotesByExercise(recentSessions);

  if (!routine && !assignment) notFound();

  const lookup = new Map([...catalogExercises, ...customExercises].map((e) => [e.id, e]));

  let model;
  if (routine) {
    const isCoach = !!profile?.isCoach || !!profile?.isAdmin;
    const students = isCoach ? await listCoachStudents(user.uid) : [];

    model = shapeRoutine(routine, lookup, {
      isAssigned: false,
      assignmentId: null,
      readOnly: false,
      lastNotes,
      students: students.map((student) => ({
        studentId: student.studentId,
        displayName: student.displayName || "",
        email: student.email || "",
      })),
    });
  } else {
    if (assignment.studentId !== user.uid && assignment.coachId !== user.uid) notFound();

    // Una asignación se entrena pero no se edita: editar, duplicar, eliminar y
    // mostrar en la portada son operaciones de la rutina del dueño, no de la
    // copia que se le asignó al alumno.
    model = shapeRoutine(
      {
        id: assignment.id,
        name: assignment.routineName,
        note: assignment.note,
        exercises: assignment.exercises,
      },
      lookup,
      {
        isAssigned: true,
        assignmentId: assignment.id,
        readOnly: true,
        students: [],
        weekNumber: assignment.weekNumber,
        weekLabel: assignment.weekLabel,
        // Las notas son de quien entrena: el coach que mira la asignación no
        // ve las suyas mezcladas con las del alumno.
        lastNotes: assignment.studentId === user.uid ? lastNotes : {},
      },
    );
  }

  return (
    <ThemeRoot>
      <Backdrop />
      <RoutineScreen routine={model} />
    </ThemeRoot>
  );
}
