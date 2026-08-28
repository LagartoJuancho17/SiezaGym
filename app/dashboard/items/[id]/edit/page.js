import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ItemForm from "@/components/items/ItemForm";
import { getCurrentUser } from "@/lib/firebase/session";
import { getUserItem } from "@/lib/items/items";
import { updateItem } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditItemPage({ params }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const item = await getUserItem(user.uid, id);

  if (!item) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-5 py-7 text-zinc-100 sm:px-8">
      <section className="mx-auto w-full max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">
          Firestore
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-normal text-zinc-50">
          Editar item
        </h1>
        <p className="mt-4 text-sm leading-6 text-zinc-400">
          Esta pantalla valida que el documento pertenezca al usuario actual.
        </p>

        <div className="mt-7">
          <ItemForm
            action={updateItem.bind(null, item.id)}
            item={item}
            submitLabel="Guardar cambios"
          />
        </div>

        <Link
          className="mt-4 inline-flex h-10 items-center justify-center border border-zinc-700 bg-transparent px-4 text-sm font-semibold text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900"
          href="/dashboard/items"
        >
          Volver a items
        </Link>
      </section>
    </main>
  );
}
