import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { getUserProfile } from "@/lib/users/users";
import { getUserRoutine } from "@/lib/routines/routines";
import { getAssignment } from "@/lib/assignments/assignments";
import { listExercises } from "@/lib/exercises/exercises";
import { listCustomExercises } from "@/lib/customExercises/customExercises";
import { listCoachStudents } from "@/lib/coach/students";
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
function shapeExercise(item, position, lookup) {
  const exercise = lookup.get(item.exerciseId);
  const timeBased = isTimeBasedRegistration(exercise?.registrationType);

  return {
    position,
    exerciseId: item.exerciseId,
    name: exercise?.nameEs || item.exerciseId,
    muscle: primaryMuscleLabel(exercise) || "Sin datos",
    mediaUrl: exercise?.mediaUrl || null,
    description: exercise?.descriptionEs || "",
    timeBased,
    // El peso se pide solo donde tiene sentido: en peso corporal o en plancha no.
    showWeight: exercise?.registrationType === "peso_reps",
    equipment: EQUIPMENT_LABELS[exercise?.equipment] || null,
    techniqueNote: item.techniqueNote || "",
    summary: prescriptionSummary(item, { timeBased }),
    sets: plannedSets(item),
  };
}

function shapeRoutine(source, lookup, { isAssigned, assignmentId, readOnly, students }) {
  const exercises = (source.exercises || []).map((item, position) =>
    shapeExercise(item, position, lookup),
  );

  return {
    id: source.id,
    name: source.name,
    note: source.note || "",
    isAssigned,
    assignmentId,
    readOnly,
    showOnHome: source.showOnHome !== false,
    students,
    exercises,
    totalSets: totalSets(source),
    estimatedMinutes: estimatedDurationMinutes(source, lookup),
    // El reparto sale de muscleWeights del catálogo, no de una estimación.
    muscles: muscleDistribution(source, lookup)
      .slice(0, 5)
      .map((row) => ({ muscle: row.muscle, percent: Math.round(row.pct * 100) })),
    hasMedia: exercises.some((exercise) => exercise.mediaUrl),
  };
}

export default async function RutinaDetallePage({ params }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const [routine, assignment, catalogExercises, customExercises, profile] = await Promise.all([
    getUserRoutine(user.uid, id),
    getAssignment(id),
    listExercises(),
    listCustomExercises(user.uid),
    getUserProfile(user.uid),
  ]);

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
      { isAssigned: true, assignmentId: assignment.id, readOnly: true, students: [] },
    );
  }

  return (
    <ThemeRoot>
      <Backdrop />
      <RoutineScreen routine={model} />
    </ThemeRoot>
  );
}
