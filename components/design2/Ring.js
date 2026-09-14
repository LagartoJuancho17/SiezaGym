/**
 * Anillo de progreso. `value` va de 0 a 1.
 *
 * Arranca arriba y avanza en sentido horario: un anillo que empieza a la
 * derecha (el default del SVG) se lee mal como progreso.
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
          stroke="rgba(255,255,255,0.28)"
          strokeWidth={stroke}
        />
        {safe > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#15181B"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - safe)}
          />
        )}
      </svg>
      <div className="absolute inset-[7px] flex items-center justify-center rounded-full border border-white/35 bg-white/25 text-white backdrop-blur-md">
        {children}
      </div>
    </div>
  );
}
