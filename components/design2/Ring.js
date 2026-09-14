/**
 * Anillo de progreso. `value` va de 0 a 1.
 *
 * Arranca arriba y avanza en sentido horario: un anillo que empieza a la
 * derecha (el default del SVG) se lee mal como progreso. Los colores salen del
 * tema, porque el trazo tiene que invertirse entre fondos claros y oscuros.
 */
export default function Ring({ value = 0, size = 58, stroke = 3, children }) {
  const safe = Math.min(1, Math.max(0, Number(value) || 0));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
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
      </svg>
      <div
        className="absolute inset-[7px] flex items-center justify-center rounded-full backdrop-blur-md"
        style={{
          background: "var(--d2-ring-core)",
          border: "1px solid var(--d2-ring-core-border)",
          color: "var(--d2-text)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
