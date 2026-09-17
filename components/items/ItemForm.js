import "./items-design2.css";

export default function ItemForm({ action, item, submitLabel = "Guardar" }) {
  return (
    <form action={action} className="d2-glass d2-form d2-items-form">
      <label className="d2-items-label">
        <span className="d2-form-label">Título</span>
        <input className="d2-input" name="title" defaultValue={item?.title || ""} required />
      </label>
      <label className="d2-items-label">
        <span className="d2-form-label">Descripción</span>
        <textarea className="d2-input d2-items-textarea" name="description" defaultValue={item?.description || ""} />
      </label>
      <label className="d2-items-label">
        <span className="d2-form-label">Estado</span>
        <select className="d2-input" name="status" defaultValue={item?.status || "pending"}>
          <option value="pending">Pendiente</option>
          <option value="active">Activo</option>
          <option value="completed">Completado</option>
        </select>
      </label>
      <button className="d2-form-save" type="submit">{submitLabel}</button>
    </form>
  );
}
