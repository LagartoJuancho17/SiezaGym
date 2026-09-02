import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { getUserProfile } from "@/lib/users/users";
import { listCoachStudents } from "@/lib/coach/students";
import ProgresoContent from "@/components/progreso/ProgresoContent";

export const dynamic = "force-dynamic";

export default async function ProgresoPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getUserProfile(user.uid);
  const isCoach = !!profile?.isCoach || !!profile?.isAdmin;
  const students = isCoach ? await listCoachStudents(user.uid) : [];

  return (
    <ProgresoContent
      isCoach={isCoach}
      students={students}
      userName={profile?.displayName || null}
    />
  );
}
