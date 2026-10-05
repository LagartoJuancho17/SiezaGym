import { notFound } from "next/navigation";
import Image from "next/image";
import ThemeRoot from "@/components/design2/ThemeRoot";
import Backdrop from "@/components/design2/Backdrop";
import { WeightIcon } from "@/components/design2/Icons";
import { getCurrentUser } from "@/lib/firebase/session";
import { listExercises } from "@/lib/exercises/exercises";
import { getSharedRoutine } from "@/lib/sharing/sharedRoutines";
import { importShared } from "./actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const shared = await getSharedRoutine(id);
  if (!shared) return { title: "Rutina no encontrada · SiezaGym" };
  return {
    title: `${shared.name} · SiezaGym`,
    description: `${shared.ownerName} te compartió una rutina de ${shared.exercises.length} ejercicios.`,
  };
}

/**
 * La página del link compartido. Pública: se puede ver sin cuenta. Desde acá
 * se abre en la app del iPhone (siezagym://r/<id>) o se copia a tus rutinas
 * en la web.
 */
export default async function SharedRoutinePage({ params }) {
  const { id } = await params;
  const shared = await getSharedRoutine(id);
  if (!shared) notFound();

  const [user, catalog] = await Promise.all([getCurrentUser(), listExercises()]);
  const byId = new Map(catalog.map((exercise) => [exercise.id, exercise]));
  const importar = importShared.bind(null, id);

  return (
    <ThemeRoot>
      <Backdrop />
      <div className="d2-page">
        <header className="d2-page-head">
          <p className="d2-label" style={{ marginTop: 0 }}>{shared.ownerName} te compartió una rutina</p>
          <h1 className="d2-page-title">{shared.name}</h1>
        </header>
        {shared.note && <p className="d2-modal-text">{shared.note}</p>}

        <div className="d2-routine-list" style={{ marginTop: 18 }}>
          {shared.exercises.map((exercise) => {
            const ficha = byId.get(exercise.exerciseId);
            const name = shared.exerciseNames[exercise.exerciseId] || ficha?.nameEs || exercise.exerciseId;
            const timed = ficha?.registrationType === "tiempo" || ficha?.registrationType === "distancia_tiempo";
            return (
              <div key={`${exercise.order}-${exercise.exerciseId}`} className="d2-routine">
                <span className="d2-ex-thumb d2-ex-thumb-sm">
                  {ficha?.mediaUrl ? (
                    <Image src={ficha.mediaUrl} alt="" width={40} height={40} unoptimized />
                  ) : (
                    <WeightIcon size={17} width={1.5} />
                  )}
                </span>
                <span className="d2-routine-body">
                  <span className="d2-routine-name"><span>{name}</span></span>
                  {exercise.group && <span className="d2-routine-meta">{exercise.group}</span>}
                </span>
                <span className="d2-routine-value">
                  {exercise.targetSets} × {exercise.targetReps}{timed ? " s" : ""}
                </span>
              </div>
            );
          })}
        </div>

        <div className="d2-modal-actions" style={{ marginTop: 24 }}>
          <a href={`siezagym://r/${id}`} className="d2-modal-primary">Abrir en la app</a>
          {user ? (
            <form action={importar}>
              <button type="submit" className="d2-modal-secondary" style={{ width: "100%" }}>
                Agregar a mis rutinas
              </button>
            </form>
          ) : (
            <a href={`/login?next=${encodeURIComponent(`/r/${id}`)}`} className="d2-modal-secondary">
              Entrar para agregarla a mis rutinas
            </a>
          )}
        </div>
      </div>
    </ThemeRoot>
  );
}
