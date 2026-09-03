// 1RM estimado (formula de Epley): w * (1 + reps/30). Exacto en reps=1 (=w).
export function estimatedOneRepMax(weight, reps) {
  const w = Number(weight) || 0;
  const r = Number(reps) || 0;
  if (w <= 0 || r <= 0) return 0;
  if (r === 1) return w;
  return w * (1 + r / 30);
}

// Mejor serie de un set de sets (mayor 1RM estimado), ignora series falladas.
export function bestSetByEstimatedOneRepMax(sets) {
  return (sets || []).reduce((best, set) => {
    if (set.failed) return best;
    const e1rm = estimatedOneRepMax(set.weight, set.reps);
    if (e1rm <= 0) return best;
    if (!best || e1rm > best.estimatedOneRepMax) {
      return { ...set, estimatedOneRepMax: e1rm };
    }
    return best;
  }, null);
}

// Peso maximo real levantado (sin estimar nada), ignora series falladas.
export function maxWeightFromSets(sets) {
  return (sets || []).reduce((max, set) => {
    if (set.failed) return max;
    const w = Number(set.weight) || 0;
    return w > max ? w : max;
  }, 0);
}
