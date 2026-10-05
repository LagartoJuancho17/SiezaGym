import { notFound } from "next/navigation";
import ThemeRoot from "@/components/design2/ThemeRoot";
import Backdrop from "@/components/design2/Backdrop";
import TemplateGallery from "@/components/design2/TemplateGallery";
import { listTemplates } from "@/lib/routines/templates";
import { listExercises } from "@/lib/exercises/exercises";

export const dynamic = "force-dynamic";

/** Las rutinas armadas sin cuenta (el botón de copiar queda deshabilitado). */
export default async function TemplatesDesignPreview() {
  if (process.env.NODE_ENV !== "development" || process.env.D2_PREVIEW !== "true") notFound();
  const catalog = await listExercises();
  return (
    <ThemeRoot>
      <Backdrop />
      <div className="d2-page">
        <h1 className="d2-page-title">Rutinas armadas</h1>
        <TemplateGallery templates={listTemplates()} catalog={catalog} />
      </div>
    </ThemeRoot>
  );
}
