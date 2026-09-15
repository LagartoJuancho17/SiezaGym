/**
 * Anillo de progreso. `value` va de 0 a 1.
 *
 * Arranca arriba y avanza en sentido horario: un anillo que empieza a la
 * derecha (el default del SVG) se lee mal como progreso. Los colores salen del
 * tema, porque el trazo tiene que invertirse entre fondos claros y oscuros.
 */
export default function Ring({ value = 0, size = 55, stroke = 2.5, children }) {
  const safe = Math.min(1, Math.max(0, Number(value) || 0));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="d2-ring" style={{ "--d2-ring-size": size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--d2-ring-track)"
          strokeWidth={stroke}
        />
        {safe > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--d2-ring-fill)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - safe)}
          />
        )}
        {safe > 0 && safe < 1 && (
          <circle
            cx={size / 2 + radius * Math.cos(safe * 2 * Math.PI)}
            cy={size / 2 + radius * Math.sin(safe * 2 * Math.PI)}
            r={stroke * 1.25}
            fill="var(--d2-ring-fill)"
          />
        )}
      </svg>
      <div
        className="d2-ring-core"
      >
        {children}
      </div>
    </div>
  );
}
