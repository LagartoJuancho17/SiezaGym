import Link from "next/link";
import { redirect } from "next/navigation";
import PageShell from "@/components/design2/PageShell";
import ItemForm from "@/components/items/ItemForm";
import { getCurrentUser } from "@/lib/firebase/session";
import { listUserItems } from "@/lib/items/items";
import { createItem, deleteItem } from "./actions";

export const dynamic = "force-dynamic";
const statusLabels = { pending: "Pendiente", active: "Activo", completed: "Completado" };

function formatDate(value) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default async function ItemsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const items = await listUserItems(user.uid);

  return (
    <PageShell title="Mis items" eyebrow="Tu espacio" backHref="/dashboard" backLabel="Dashboard">
      <section className="d2-routine-section" aria-labelledby="create-item-title">
        <h2 id="create-item-title" className="d2-items-heading">Crear item</h2>
        <ItemForm action={createItem} submitLabel="Crear item" />
      </section>
      <section className="d2-routine-section" aria-labelledby="saved-items-title">
        <div className="d2-section-heading">
          <h2 id="saved-items-title">Guardados</h2>
          <span className="d2-routine-meta">{items.length} total</span>
        </div>
        {items.length === 0 ? (
          <div className="d2-glass d2-empty">Todavía no tenés items. Creá el primero con el formulario.</div>
        ) : (
          <div className="d2-routine-list d2-items-list">
            {items.map((item) => (
              <article className="d2-items-row" key={item.id}>
                <div className="d2-items-row-heading">
                  <h3>{item.title}</h3>
                  <span className="d2-items-status">{statusLabels[item.status] || item.status}</span>
                </div>
                {item.description ? <p className="d2-items-description">{item.description}</p> : null}
                <p className="d2-routine-meta">Creado: {formatDate(item.createdAt)}</p>
                <div className="d2-items-actions">
                  <Link className="d2-items-button" href={`/dashboard/items/${item.id}/edit`}>Editar</Link>
                  <form action={deleteItem.bind(null, item.id)}>
                    <button className="d2-items-button" type="submit" aria-label={`Eliminar ${item.title}`}>Eliminar</button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
