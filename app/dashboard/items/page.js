import Link from "next/link";
import { redirect } from "next/navigation";
import ItemForm from "@/components/items/ItemForm";
import { getCurrentUser } from "@/lib/firebase/session";
import { listUserItems } from "@/lib/items/items";
import { createItem, deleteItem } from "./actions";

export const dynamic = "force-dynamic";

function formatDate(value) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function ItemsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const items = await listUserItems(user.uid);

  return (
    <main className="min-h-screen bg-zinc-950 px-5 py-7 text-zinc-100 sm:px-8">
      <header className="mx-auto flex w-full max-w-6xl flex-col gap-5 border-b border-zinc-800 pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">
            Firestore
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal text-zinc-50 sm:text-6xl">
            Items
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400">
            ABM base con documentos asociados al usuario autenticado.
          </p>
        </div>
        <Link
          className="inline-flex h-10 items-center justify-center border border-zinc-700 bg-transparent px-4 text-sm font-semibold text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900"
          href="/dashboard"
        >
          Volver
        </Link>
      </header>

      <section className="mx-auto mt-7 grid w-full max-w-6xl gap-6 lg:grid-cols-[360px_1fr]">
        <div>
          <h2 className="mb-3 text-lg font-semibold text-zinc-100">
            Crear item
          </h2>
          <ItemForm action={createItem} submitLabel="Crear item" />
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-zinc-100">
              Mis items
            </h2>
            <span className="text-sm text-zinc-500">{items.length} total</span>
          </div>

          {items.length === 0 ? (
            <div className="border border-zinc-800 p-6 text-sm leading-6 text-zinc-400">
              Todavia no hay items cargados para este usuario.
            </div>
          ) : (
            <div className="grid gap-px overflow-hidden border border-zinc-800 bg-zinc-800">
              {items.map((item) => (
                <article
                  className="grid gap-4 bg-zinc-950 p-5 md:grid-cols-[1fr_auto]"
                  key={item.id}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="overflow-wrap-anywhere text-base font-semibold text-zinc-100">
                        {item.title}
                      </h3>
                      <span className="border border-zinc-800 px-2 py-1 text-xs uppercase tracking-[0.12em] text-zinc-400">
                        {item.status}
                      </span>
                    </div>
                    {item.description ? (
                      <p className="mt-3 overflow-wrap-anywhere text-sm leading-6 text-zinc-400">
                        {item.description}
                      </p>
                    ) : null}
                    <p className="mt-3 text-xs text-zinc-600">
                      Creado: {formatDate(item.createdAt)}
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <Link
                      className="inline-flex h-9 items-center border border-zinc-700 px-3 text-sm font-semibold text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900"
                      href={`/dashboard/items/${item.id}/edit`}
                    >
                      Editar
                    </Link>
                    <form action={deleteItem.bind(null, item.id)}>
                      <button
                        className="h-9 border border-red-900/80 px-3 text-sm font-semibold text-red-300 transition hover:bg-red-950/50"
                        type="submit"
                      >
                        Eliminar
                      </button>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
