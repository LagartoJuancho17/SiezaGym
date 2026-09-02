import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { getUserProfile } from "@/lib/users/users";
import { getUserRoutine } from "@/lib/routines/routines";
import { getAssignment } from "@/lib/assignments/assignments";
import { listExercises } from "@/lib/exercises/exercises";
import { listCustomExercises } from "@/lib/customExercises/customExercises";
import { listCoachStudents } from "@/lib/coach/students";
import RoutineDetail from "@/components/routines/RoutineDetail";

export const dynamic = "force-dynamic";

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

  if (routine) {
    const isCoach = !!profile?.isCoach || !!profile?.isAdmin;
    const students = isCoach ? await listCoachStudents(user.uid) : [];

    return (
      <RoutineDetail
        routine={routine}
        catalogExercises={catalogExercises}
        customExercises={customExercises}
        isCoach={isCoach}
        students={students}
      />
    );
  }

  if (assignment.studentId !== user.uid && assignment.coachId !== user.uid) notFound();

  const isViewerStudent = assignment.studentId === user.uid;

  const assignmentRoutine = {
    id: assignment.id,
    ownerId: assignment.studentId,
    name: assignment.routineName,
    note: assignment.note,
    exercises: assignment.exercises,
    lastUsedAt: assignment.lastUsedAt,
    createdAt: assignment.assignedAt,
    updatedAt: assignment.assignedAt,
    isAssigned: true,
    assignmentId: assignment.id,
    exerciseLogs: assignment.exerciseLogs || {},
  };

  return (
    <RoutineDetail
      routine={assignmentRoutine}
      catalogExercises={catalogExercises}
      customExercises={customExercises}
      isCoach={!isViewerStudent}
      students={[]}
      readOnly={isViewerStudent}
    />
  );
}
