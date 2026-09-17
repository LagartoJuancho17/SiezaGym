import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { getUserProfile } from "@/lib/users/users";
import { getStudentCount } from "@/lib/coach/students";
import { listTrainedDates, listUserSessions } from "@/lib/sessions/sessions";
import { toLocalDayKey } from "@/lib/sessions/streak";
import { listExercises } from "@/lib/exercises/exercises";
import { listCustomExercises } from "@/lib/customExercises/customExercises";
import {
  computeEffectivenessPct,
  computeVolumeByWeek,
  computeWeeklySessionCounts,
  computeWeeklyVolume,
} from "@/lib/sessions/weeklyStats";
import { pushPullBalance, volumeByMuscleGroup } from "@/lib/home/metrics";
import { exerciseProgress, formatKg, trendLabel } from "@/lib/progress/summary";
import ThemeRoot from "@/components/design2/ThemeRoot";
import Backdrop from "@/components/design2/Backdrop";
import WeekVolume from "@/components/design2/WeekVolume";
import TrainedGrid from "@/components/design2/TrainedGrid";
import TabBar from "@/components/design2/TabBar";
import { ChevronRightIcon, WeightIcon } from "@/components/design2/Icons";
import Image from "next/image";

export const dynamic = "force-dynamic";

/** Semanas que dibuja la grilla, y de ahí sale cuántos días hay que pedir. */
const GRID_WEEKS = 26;

export default async function ProgresoPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getUserProfile(user.uid);
  const isCoach = !!profile?.isCoach || !!profile?.isAdmin;

  const [sessions, trainedDates, catalogExercises, customExercises, studentCount] =
    await Promise.all([
      // 200 sesiones cubren holgado las 12 semanas del gráfico y la lista de
      // ejercicios.
      listUserSessions(user.uid, { limitCount: 200 }),
      listTrainedDates(user.uid, { sinceDays: GRID_WEEKS * 7 + 7 }),
      listExercises(),
      listCustomExercises(user.uid),
      isCoach ? getStudentCount(user.uid) : Promise.resolve(0),
    ]);

  const counts = computeWeeklySessionCounts(sessions);
  const weekVolumeKg = computeWeeklyVolume(sessions);
  const effectivenessPct = computeEffectivenessPct(counts.thisWeek, counts.lastWeek);
  const volumeByWeek = computeVolumeByWeek(sessions, 12);

  const byId = new Map([...catalogExercises, ...customExercises].map((e) => [e.id, e]));
  const exercises = exerciseProgress(sessions, { limit: 12 }).map((row) => ({
    ...row,
    name: byId.get(row.exerciseId)?.nameEs || row.exerciseId,
    mediaUrl: byId.get(row.exerciseId)?.mediaUrl || null,
  }));

  // Reparto muscular y empuje/tracción salen de muscleWeights y del patrón de
  // cada ejercicio del catálogo, cruzados con el volumen real de cada serie.
  const muscles = volumeByMuscleGroup(sessions, byId, { limit: 6 });
  const balance = pushPullBalance(sessions, byId);
  const hasMedia = exercises.some((exercise) => exercise.mediaUrl);

  const hasSessions = sessions.length > 0;

  return (
    <ThemeRoot>
      <Backdrop />

      <div className="d2-page">
        <header className="d2-page-head">
          <h1 className="d2-page-title">Progreso</h1>
        </header>

        <p className="d2-glass d2-stats">
          <span className="d2-stat">
            <span className="d2-stat-value">{formatKg(weekVolumeKg)}</span>
            <span className="d2-stat-label">esta semana</span>
          </span>
          <span className="d2-stat">
            <span className="d2-stat-value">{counts.thisWeek}</span>
            <span className="d2-stat-label">
              {counts.thisWeek === 1 ? "entrenamiento" : "entrenamientos"}
            </span>
          </span>
          <span className="d2-stat">
            <span className="d2-stat-value">{trendLabel(effectivenessPct)}</span>
            {/* Compara entrenamientos contra la semana pasada, no volumen. */}
            <span className="d2-stat-label">vs semana anterior</span>
          </span>
        </p>

        {!hasSessions ? (
          <p className="d2-glass d2-empty">
            Todavía no terminaste ningún entrenamiento. Cuando termines el primero, acá vas a ver
            tu volumen semana a semana.
            <Link href="/rutinas" className="d2-empty-action">
              Ir a mis rutinas
            </Link>
          </p>
        ) : (
          // En escritorio: los gráficos a la izquierda, los ejercicios a la
          // derecha. En teléfono la clase no hace nada y siguen uno abajo del
          // otro.
          <div className="d2-split">
            <div>
              <p className="d2-label">Volumen por semana</p>
              <WeekVolume points={volumeByWeek} />

              <p className="d2-label">Días entrenados</p>
              <TrainedGrid
                trainedDates={trainedDates}
                weeks={GRID_WEEKS}
                todayKey={toLocalDayKey(new Date())}
              />

              {muscles.rows.length > 0 && (
                <>
                  <p className="d2-label">Dónde fue el volumen</p>
                  <div className="d2-panel d2-muscles">
                    {muscles.rows.map((row) => (
                      <div key={row.muscle} className="d2-muscle-row">
                        <p className="d2-muscle-head">
                          <span>{row.label}</span>
                          <span>{formatKg(row.kg)}</span>
                        </p>
                        <span className="d2-muscle-bar">
                          <span style={{ width: `${Math.round(row.pct * 100)}%` }} />
                        </span>
                      </div>
                    ))}
                    {/* El reparto sale de muscleWeights del catálogo cruzado
                        con el peso y las reps de cada serie: no es una
                        estimación por tipo de rutina. */}
                    <p className="d2-chart-foot">
                      <span>{formatKg(muscles.totalKg)} repartidos</span>
                      <span />
                      <span>últimos {sessions.length} entrenamientos</span>
                    </p>
                  </div>
                </>
              )}

              {balance.hasData && (
                <>
                  <p className="d2-label">Empuje y tracción</p>
                  <div className="d2-panel d2-chart">
                    <p className="d2-balance" role="img" aria-label={`Empuje ${balance.pushKg} kilos, tracción ${balance.pullKg} kilos. ${balance.label}.`}>
                      <span className="d2-balance-push" style={{ width: `${balance.pct}%` }} />
                      <span className="d2-balance-pull" style={{ width: `${100 - balance.pct}%` }} />
                    </p>
                    <p className="d2-chart-foot">
                      <span>empuje {formatKg(balance.pushKg)}</span>
                      <span>{balance.label}</span>
                      <span>tracción {formatKg(balance.pullKg)}</span>
                    </p>
                  </div>
                </>
              )}
            </div>

            {exercises.length > 0 && (
              <div>
                <p className="d2-label">Por ejercicio</p>
                <div className="d2-routine-list">
                  {exercises.map((exercise) => (
                    <Link
                      key={exercise.exerciseId}
                      href={`/progreso/${exercise.exerciseId}`}
                      className="d2-routine"
                    >
                      <span className="d2-ex-thumb d2-ex-thumb-sm">
                        {exercise.mediaUrl ? (
                          <Image src={exercise.mediaUrl} alt="" width={40} height={40} unoptimized />
                        ) : (
                          <WeightIcon size={17} width={1.5} />
                        )}
                      </span>
                      <span className="d2-routine-body">
                        <span className="d2-routine-name">
                          <span>{exercise.name}</span>
                        </span>
                        <span className="d2-routine-meta">
                          {exercise.sessions}{" "}
                          {exercise.sessions === 1 ? "entrenamiento" : "entrenamientos"}
                        </span>
                      </span>
                      {exercise.bestOneRepMax > 0 && (
                        <span className="d2-routine-value">
                          {exercise.bestOneRepMax} kg
                          {/* Epley sobre una serie real: es una estimación y se
                              dice, no se presenta como un peso levantado. */}
                          <span className="d2-routine-unit">1RM est.</span>
                        </span>
                      )}
                      <ChevronRightIcon size={16} width={1.6} className="d2-routine-go" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {hasMedia && (
          <p className="d2-credit">
            Animaciones de ejercicios ©{" "}
            <a href="https://gymvisual.com/" target="_blank" rel="noopener noreferrer">
              Gym visual
            </a>
          </p>
        )}

        {isCoach && (
          <>
            <p className="d2-label">Entrenador</p>
            <div className="d2-panel">
              <Link href="/dashboard/coach" className="d2-setting">
                <span className="d2-setting-body">
                  <span className="d2-setting-name">Progreso de tus alumnos</span>
                  <span className="d2-setting-hint">
                    {studentCount === 1 ? "1 alumno" : `${studentCount} alumnos`}
                  </span>
                </span>
                <ChevronRightIcon size={16} width={1.6} className="d2-setting-go" />
              </Link>
            </div>
          </>
        )}
      </div>

      <TabBar />
    </ThemeRoot>
  );
}
