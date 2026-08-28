import { redirect } from "next/navigation";
import Link from "next/link";
import { logout } from "./actions";
import { getCurrentUser } from "@/lib/firebase/session";
import { listUserItems } from "@/lib/items/items";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
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
            Ruta protegida
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal text-zinc-50 sm:text-6xl">
            Dashboard
          </h1>
        </div>
        <form action={logout}>
          <button
            className="h-10 border border-zinc-700 bg-transparent px-4 text-sm font-semibold text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900"
            type="submit"
          >
            Cerrar sesion
          </button>
        </form>
      </header>

      <section className="mx-auto mt-7 grid w-full max-w-6xl grid-cols-1 gap-px overflow-hidden border border-zinc-800 bg-zinc-800 md:grid-cols-3">
        <article className="min-w-0 bg-zinc-950 p-5">
          <span className="block text-sm text-zinc-500">Usuario</span>
          <strong className="mt-3 block overflow-wrap-anywhere text-base font-semibold text-zinc-100">
            {user.email || "Sin email"}
          </strong>
        </article>
        <article className="min-w-0 bg-zinc-950 p-5">
          <span className="block text-sm text-zinc-500">UID</span>
          <strong className="mt-3 block overflow-wrap-anywhere font-mono text-sm font-medium text-zinc-200">
            {user.uid}
          </strong>
        </article>
        <article className="min-w-0 bg-zinc-950 p-5">
          <span className="block text-sm text-zinc-500">Items</span>
          <strong className="mt-3 block overflow-wrap-anywhere text-base font-semibold text-zinc-100">
            {items.length}
          </strong>
        </article>
      </section>

      <section className="mx-auto mt-7 w-full max-w-6xl border border-zinc-800 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">
              ABM base con Firestore
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              La coleccion `items` muestra documentos filtrados por el usuario
              autenticado.
            </p>
          </div>
          <Link
            className="inline-flex h-10 items-center justify-center border border-cyan-400 bg-cyan-400 px-4 text-sm font-semibold text-zinc-950 transition hover:border-cyan-300 hover:bg-cyan-300"
            href="/dashboard/items"
          >
            Ver items
          </Link>
        </div>
      </section>
    </main>
  );
}
