import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { getUserProfile } from "@/lib/users/users";
import { listUserSessions, weeklyVolumeKg } from "@/lib/sessions/sessions";
import { getStudentCount, getLinkedCoach } from "@/lib/coach/students";
import { logout } from "@/app/dashboard/actions";
import PerfilForm from "@/components/perfil/PerfilForm";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getUserProfile(user.uid);
  const isCoach = !!profile?.isCoach || !!profile?.isAdmin;

  const [sessions, weekVolume, studentCount, linkedCoach] = await Promise.all([
    listUserSessions(user.uid, { limitCount: 500 }),
    weeklyVolumeKg(user.uid),
    isCoach ? getStudentCount(user.uid) : Promise.resolve(0),
    !isCoach ? getLinkedCoach(user.uid) : Promise.resolve(null),
  ]);

  const initial = (profile?.displayName || user.email || "?").charAt(0).toUpperCase();
  const memberSince = profile?.createdAt
    ? new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(new Date(profile.createdAt))
    : null;

  return (
    <div className="flex flex-col gap-5 px-[18px] pb-[100px] lg:px-0">
      <header>
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-faint">Perfil</p>
        <h1 className="font-display mt-1 text-[26px] uppercase leading-none text-white">
          Tu cuenta
        </h1>
      </header>

      <section className="flex items-center gap-4 rounded-[22px] border border-hair bg-glass p-[18px]">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-hair bg-glass2 text-xl font-semibold text-muted">
          {profile?.photoURL ? (
            <Image
              src={profile.photoURL}
              alt=""
              width={64}
              height={64}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            initial
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-text">
            {profile?.displayName || "Sin nombre"}
          </p>
          <p className="truncate text-xs text-faint">{user.email}</p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-teal2">
            {profile?.isAdmin ? "Admin & Coach" : isCoach ? "Entrenador" : "Atleta"}
          </p>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <div className="rounded-[18px] border border-hair bg-glass p-[15px]">
          <p className="text-[11px] font-medium uppercase tracking-wider text-faint">Sesiones</p>
          <p className="font-mono-digit mt-1 text-2xl text-white">{sessions.length}</p>
        </div>
        <div className="rounded-[18px] border border-hair bg-glass p-[15px]">
          <p className="text-[11px] font-medium uppercase tracking-wider text-faint">Volumen semanal</p>
          <p className="font-mono-digit mt-1 text-2xl text-teal2">{weekVolume}kg</p>
        </div>
        {isCoach ? (
          <div className="rounded-[18px] border border-hair bg-glass p-[15px]">
            <p className="text-[11px] font-medium uppercase tracking-wider text-faint">Alumnos</p>
            <p className="font-mono-digit mt-1 text-2xl text-white">{studentCount}</p>
          </div>
        ) : (
          <div className="rounded-[18px] border border-hair bg-glass p-[15px]">
            <p className="text-[11px] font-medium uppercase tracking-wider text-faint">Entrenador</p>
            <p className="mt-1 truncate text-sm font-semibold text-white">
              {linkedCoach?.displayName || "Sin vincular"}
            </p>
          </div>
        )}
        <div className="rounded-[18px] border border-hair bg-glass p-[15px]">
          <p className="text-[11px] font-medium uppercase tracking-wider text-faint">Miembro desde</p>
          <p className="mt-1 text-sm font-semibold text-white">{memberSince || "—"}</p>
        </div>
      </div>

      <PerfilForm profile={profile} />

      <form action={logout}>
        <button
          type="submit"
          className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-hair text-sm font-semibold text-faint transition hover:border-destructive/40 hover:text-destructive"
        >
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}
