import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { listExercises } from "@/lib/exercises/exercises";
import { listTemplates } from "@/lib/routines/templates";
import ThemeRoot from "@/components/design2/ThemeRoot";
import Backdrop from "@/components/design2/Backdrop";
import TabBar from "@/components/design2/TabBar";
import { ArrowLeftIcon } from "@/components/design2/Icons";
import TemplateGallery from "@/components/design2/TemplateGallery";
import { addTemplate } from "./actions";

export const dynamic = "force-dynamic";

/**
 * Diez rutinas listas para copiar. Cada una se despliega para ver qué tiene y
 * se copia a tus rutinas con un botón; después se edita como cualquier otra.
 */
export default async function RutinasArmadasPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/rutinas/armadas");

  const catalog = await listExercises();
  const templates = listTemplates();

  return (
    <ThemeRoot>
      <Backdrop />
      <div className="d2-page">
        <header className="d2-page-head">
          <Link href="/rutinas" aria-label="Volver a rutinas" className="d2-back">
            <ArrowLeftIcon size={20} width={1.8} />
          </Link>
          <h1 className="d2-page-title" style={{ flex: 1 }}>Rutinas armadas</h1>
        </header>
        <p className="d2-modal-text" style={{ marginTop: 0 }}>
          Elegí una, copiala a tus rutinas y cambiala como quieras.
        </p>

        <TemplateGallery templates={templates} catalog={catalog} addAction={addTemplate} />
      </div>
      <TabBar />
    </ThemeRoot>
  );
}
