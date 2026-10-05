import Image from "next/image";
import { isTimeBasedRegistration } from "@/lib/exercises/constants";
import { templateDetail } from "@/lib/routines/templates";
import { WeightIcon } from "./Icons";

/**
 * Las rutinas armadas, desplegables, cada una con su botón para copiarla.
 * `addAction` es la server action que la copia (sin ella, en la vista previa,
 * el botón queda deshabilitado).
 */
export default function TemplateGallery({ templates, catalog, addAction }) {
  const byId = new Map(catalog.map((exercise) => [exercise.id, exercise]));
  return (
    <div className="d2-templates">
      {templates.map((template) => (
        <details key={template.id} className="d2-panel d2-template">
          <summary className="d2-template-head">
            <span className="d2-routine-body">
              <span className="d2-routine-name"><span>{template.name}</span></span>
              <span className="d2-routine-meta">{templateDetail(template)}</span>
            </span>
            <span className="d2-routine-value">
              {template.exercises.length}
              <span className="d2-routine-unit">ejercicios</span>
            </span>
          </summary>

          <p className="d2-template-desc">{template.descripcion}</p>
          <ul className="d2-template-list">
            {template.exercises.map((exercise) => {
              const ficha = byId.get(exercise.exerciseId);
              const timed = isTimeBasedRegistration(ficha?.registrationType);
              return (
                <li key={exercise.exerciseId} className="d2-template-row">
                  <span className="d2-ex-thumb d2-ex-thumb-sm">
                    {ficha?.mediaUrl ? (
                      <Image src={ficha.mediaUrl} alt="" width={40} height={40} unoptimized />
                    ) : (
                      <WeightIcon size={17} width={1.5} />
                    )}
                  </span>
                  <span className="d2-routine-body">
                    <span className="d2-routine-name"><span>{ficha?.nameEs || exercise.nombre}</span></span>
                    {exercise.group && <span className="d2-routine-meta">{exercise.group}</span>}
                  </span>
                  <span className="d2-routine-value">
                    {exercise.targetSets} × {exercise.targetReps}{timed ? " s" : ""}
                  </span>
                </li>
              );
            })}
          </ul>
          <form action={addAction ? addAction.bind(null, template.id) : undefined} className="d2-template-add">
            <button type="submit" disabled={!addAction} className="d2-modal-primary" style={{ width: "100%" }}>
              Agregar a mis rutinas
            </button>
          </form>
        </details>
      ))}
    </div>
  );
}
