import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { getUserProfile } from "@/lib/users/users";
import { listTrainedDates, listUserSessions } from "@/lib/sessions/sessions";
import { computeStreak } from "@/lib/sessions/streak";
import { getLinkedCoach, getStudentCount } from "@/lib/coach/students";
import { logout } from "@/app/dashboard/actions";
import ThemeRoot from "@/components/design2/ThemeRoot";
import Backdrop from "@/components/design2/Backdrop";
import ProfileForm from "@/components/design2/ProfileForm";
import ThemePicker from "@/components/design2/ThemePicker";
import TabBar from "@/components/design2/TabBar";
import CoachConnection from "@/components/design2/CoachConnection";
import { ChevronRightIcon } from "@/components/design2/Icons";

export const dynamic = "force-dynamic";

// El límite existe para no traerse una colección entera a la memoria. Si
// alguna vez alguien lo pasa, los totales dirían "las últimas 500" sin avisar,
// así que la pantalla lo declara.
const SESSION_LIMIT = 500;

// Lo que guarda Firebase en sign_in_provider. Un proveedor que no esté acá se
// muestra tal cual: es preferible a afirmar "email y contraseña" de algo que
// quizá no lo sea.
const PROVIDER_LABELS = {
  "google.com": "Google",
  password: "Email y contraseña",
};

export default async function PerfilPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getUserProfile(user.uid);
  const isCoach = !!profile?.isCoach || !!profile?.isAdmin;

  const [sessions, trainedDates, studentCount, linkedCoach] = await Promise.all([
    listUserSessions(user.uid, { limitCount: SESSION_LIMIT }),
    listTrainedDates(user.uid),
    isCoach ? getStudentCount(user.uid) : Promise.resolve(0),
    isCoach ? Promise.resolve(null) : getLinkedCoach(user.uid),
  ]);

  // Los tres números salen de las sesiones guardadas, no de una estimación.
  // La racha usa la misma función que la portada, así no pueden discrepar.
  const streak = computeStreak(trainedDates);
  const totalSets = sessions.reduce((total, session) => total + (session.totalSetsCompleted || 0), 0);

  const name = profile?.displayName || "Sin nombre";
  const initial = (profile?.displayName || user.email || "?").charAt(0).toUpperCase();
  const role = profile?.isAdmin ? "Admin y entrenador" : isCoach ? "Entrenador" : "Atleta";
  const memberSince = profile?.createdAt
    ? new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(
        new Date(profile.createdAt),
      )
    : null;

  return (
    <ThemeRoot>
      <Backdrop />

      <div className="d2-page">
        <header className="d2-page-head">
          <h1 className="d2-page-title">Perfil</h1>
        </header>

        <section className="d2-glass d2-id">
          <span className="d2-avatar">
            {profile?.photoURL ? (
              <Image
                src={profile.photoURL}
                alt=""
                width={65}
                height={65}
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="d2-avatar-initial">{initial}</span>
            )}
          </span>

          <span className="d2-id-body">
            <span className="d2-id-name">{name}</span>
            <span className="d2-id-mail">{user.email}</span>
            <span className="d2-id-role">
              {role}
              {memberSince && ` · desde ${memberSince}`}
            </span>
          </span>
        </section>

        <p className="d2-glass d2-stats">
          <span className="d2-stat">
            <span className="d2-stat-value">{sessions.length}</span>
            <span className="d2-stat-label">
              {sessions.length === 1 ? "entrenamiento" : "entrenamientos"}
            </span>
          </span>
          <span className="d2-stat">
            <span className="d2-stat-value">{totalSets}</span>
            <span className="d2-stat-label">{totalSets === 1 ? "serie" : "series"}</span>
          </span>
          <span className="d2-stat">
            <span className="d2-stat-value">{streak}</span>
            <span className="d2-stat-label">
              {streak === 1 ? "día seguido" : "días seguidos"}
            </span>
          </span>
        </p>

        {/* En escritorio: lo que se edita a la izquierda, lo que se ajusta
            una vez a la derecha. */}
        <div className="d2-split">
          <div>
            <p className="d2-label">Tus datos</p>
            <ProfileForm profile={profile} />
          </div>

          <div>
            <p className="d2-label">Configuración</p>
        <div className="d2-panel">
          <Link href="/dashboard" className="d2-setting">
            <span className="d2-setting-body">
              <span className="d2-setting-name">Dashboard</span>
              <span className="d2-setting-hint">Tu resumen y accesos</span>
            </span>
            <ChevronRightIcon size={16} width={1.6} className="d2-setting-go" />
          </Link>
          <div>
            <div className="d2-setting">
              <span className="d2-setting-body">
                <span className="d2-setting-name">Tema</span>
                <span className="d2-setting-hint">
                  El fondo de la app. Se guarda en este dispositivo.
                </span>
              </span>
            </div>
            <ThemePicker />
          </div>

          {isCoach ? (
            <Link href="/dashboard/coach" className="d2-setting">
              <span className="d2-setting-body">
                <span className="d2-setting-name">Panel del entrenador</span>
                <span className="d2-setting-hint">
                  {studentCount === 1 ? "1 alumno" : `${studentCount} alumnos`}
                </span>
              </span>
              <ChevronRightIcon size={16} width={1.6} className="d2-setting-go" />
            </Link>
          ) : (
            <div className="d2-setting">
              <span className="d2-setting-body">
                <span className="d2-setting-name">Entrenador</span>
                <span className="d2-setting-hint">Quien te asigna rutinas</span>
              </span>
              <span className="d2-setting-value">
                {linkedCoach?.displayName || "Sin vincular"}
              </span>
            </div>
          )}

          <div className="d2-setting">
            <span className="d2-setting-body">
              <span className="d2-setting-name">Cuenta</span>
              <span className="d2-setting-hint">Cómo iniciás sesión</span>
            </span>
            <span className="d2-setting-value">
              {PROVIDER_LABELS[profile?.provider] || profile?.provider || "—"}
            </span>
          </div>
        </div>

        {!isCoach && <><p className="d2-label">Tu profesor</p><CoachConnection coach={linkedCoach} /></>}

        {sessions.length === SESSION_LIMIT && (
          <p className="d2-form-note">
            Los totales cuentan tus últimos {SESSION_LIMIT} entrenamientos.
          </p>
        )}

            <form action={logout}>
              <button type="submit" className="d2-signout">
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </div>

      <TabBar />
    </ThemeRoot>
  );
}
