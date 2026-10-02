import CoachPageShell from "@/components/coach/CoachPageShell";

function Line({ width, height = 12 }) {
  return <span className="d2-coach-skeleton" style={{ width, height }} aria-hidden="true" />;
}

export default function CoachLoading() {
  return (
    <CoachPageShell title="Panel del entrenador" backHref="/" backLabel="Volver al inicio">
      <div className="d2-coach-dashboard d2-coach-loading" role="status" aria-label="Cargando panel del entrenador">
        <div className="d2-coach-welcome"><div><Line width={180} height={23} /><div style={{ marginTop: 12 }}><Line width={260} /></div></div></div>
        <div className="d2-coach-kpis">
          {[0, 1, 2].map((index) => <div className="d2-coach-kpi" key={index}><Line width="65%" /><Line width={54} height={34} /><Line width="45%" /></div>)}
        </div>
        <div className="d2-coach-main-grid">
          <div className="d2-coach-panel"><Line width={140} height={18} /><div style={{ marginTop: 24 }}><Line width="100%" height={42} /></div>{[0, 1, 2].map((index) => <div key={index} style={{ marginTop: 18 }}><Line width="100%" height={56} /></div>)}</div>
          <div className="d2-coach-panel"><Line width={180} height={18} /><div style={{ marginTop: 28 }}><Line width="75%" height={44} /></div></div>
        </div>
      </div>
    </CoachPageShell>
  );
}
