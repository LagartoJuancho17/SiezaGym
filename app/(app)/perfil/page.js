import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { getUserProfile } from "@/lib/users/users";
import { listUserSessions } from "@/lib/sessions/sessions";
import { getStudentCount, getLinkedCoach } from "@/lib/coach/students";
import { logout } from "@/app/dashboard/actions";
import PerfilForm from "@/components/perfil/PerfilForm";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getUserProfile(user.uid);
  const isCoach = !!profile?.isCoach || !!profile?.isAdmin;

  const [sessions, studentCount, linkedCoach] = await Promise.all([
    listUserSessions(user.uid, { limitCount: 500 }),
    isCoach ? getStudentCount(user.uid) : Promise.resolve(0),
    !isCoach ? getLinkedCoach(user.uid) : Promise.resolve(null),
  ]);

  const initial = (profile?.displayName || user.email || "?").charAt(0).toUpperCase();
  const memberSince = profile?.createdAt
    ? new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(new Date(profile.createdAt))
    : null;

  return (
    <div className="mx-auto flex max-w-[1360px] flex-col gap-6 px-4 pt-20 pb-28 sm:px-8 sm:pt-24 md:pb-16">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#FF5733]">Perfil</p>
        <h1 className="font-sans mt-0.5 text-3xl font-extrabold tracking-tight text-white">
          Tu cuenta
        </h1>
      </header>

      <section className="flex items-center gap-4 rounded-3xl border border-[#6B1717] bg-[#EDE8E1] p-5 shadow-sm">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#6B1717]/30 bg-[#DFD8CE] text-xl font-bold text-[#141414]">
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
          <p className="truncate font-sans text-lg font-bold text-[#141414]">
            {profile?.displayName || "Sin nombre"}
          </p>
          <p className="truncate text-xs text-[#756C65]">{user.email}</p>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-[#FF5733]">
            {profile?.isAdmin ? "Admin & Coach" : isCoach ? "Entrenador" : "Atleta"}
          </p>
        </div>
      </section>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-[#6B1717] bg-[#EDE8E1] p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#756C65]">Sesiones</p>
          <p className="font-sans mt-1 text-2xl font-extrabold text-[#141414]">{sessions.length}</p>
        </div>
        {isCoach ? (
          <div className="rounded-2xl border border-[#6B1717] bg-[#EDE8E1] p-4 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#756C65]">Alumnos</p>
            <p className="font-sans mt-1 text-2xl font-extrabold text-[#141414]">{studentCount}</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#6B1717] bg-[#EDE8E1] p-4 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#756C65]">Entrenador</p>
            <p className="mt-1 truncate font-sans text-sm font-bold text-[#141414]">
              {linkedCoach?.displayName || "Sin vincular"}
            </p>
          </div>
        )}
        <div className="rounded-2xl border border-[#6B1717] bg-[#EDE8E1] p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#756C65]">Miembro desde</p>
          <p className="mt-1 font-sans text-sm font-bold text-[#141414]">{memberSince || "—"}</p>
        </div>
      </div>

      <PerfilForm profile={profile} />

      <form action={logout}>
        <button
          type="submit"
          className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}
