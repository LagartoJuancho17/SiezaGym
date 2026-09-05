export function nextRoutineIndex(current, total) {
  if (total <= 0) return 0;
  return (current + 1) % total;
}

export function isOwnFlightTransition(event) {
  return (
    event.target === event.currentTarget &&
    (event.propertyName === "transform" || event.propertyName === "opacity")
  );
}

export function routineCardVeilOpacity(depth) {
  const normalizedDepth = Math.max(0, Number(depth) || 0);
  if (normalizedDepth === 0) return 0;
  return Math.min(0.68, 0.26 + normalizedDepth * 0.16);
}
