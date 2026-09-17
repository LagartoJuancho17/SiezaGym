import { notFound, redirect } from "next/navigation";
import PageShell from "@/components/design2/PageShell";
import ItemForm from "@/components/items/ItemForm";
import { getCurrentUser } from "@/lib/firebase/session";
import { getUserItem } from "@/lib/items/items";
import { updateItem } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditItemPage({ params }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const item = await getUserItem(user.uid, id);
  if (!item) notFound();

  return (
    <PageShell title="Editar item" eyebrow="Mis items" backHref="/dashboard/items" backLabel="Volver a items">
      <section className="d2-routine-section" aria-label="Editar item">
        <ItemForm action={updateItem.bind(null, item.id)} item={item} submitLabel="Guardar cambios" />
      </section>
    </PageShell>
  );
}
