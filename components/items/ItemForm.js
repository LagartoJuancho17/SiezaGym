export default function ItemForm({ action, item, submitLabel = "Guardar" }) {
  return (
    <form action={action} className="grid gap-4 border border-zinc-800 p-5">
      <label className="grid gap-2 text-sm font-medium text-zinc-300">
        <span>Titulo</span>
        <input
          className="h-11 border border-zinc-800 bg-zinc-950 px-3 text-zinc-100 outline-none transition focus:border-cyan-400"
          name="title"
          defaultValue={item?.title || ""}
          required
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-zinc-300">
        <span>Descripcion</span>
        <textarea
          className="min-h-28 resize-y border border-zinc-800 bg-zinc-950 px-3 py-3 text-zinc-100 outline-none transition focus:border-cyan-400"
          name="description"
          defaultValue={item?.description || ""}
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-zinc-300">
        <span>Estado</span>
        <select
          className="h-11 border border-zinc-800 bg-zinc-950 px-3 text-zinc-100 outline-none transition focus:border-cyan-400"
          name="status"
          defaultValue={item?.status || "pending"}
        >
          <option value="pending">Pendiente</option>
          <option value="active">Activo</option>
          <option value="completed">Completado</option>
        </select>
      </label>

      <button
        className="h-11 border border-cyan-400 bg-cyan-400 px-4 text-sm font-semibold text-zinc-950 transition hover:border-cyan-300 hover:bg-cyan-300"
        type="submit"
      >
        {submitLabel}
      </button>
    </form>
  );
}
