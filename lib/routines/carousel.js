export function nextRoutineIndex(current, total) {
  if (total <= 0) return 0;
  return (current + 1) % total;
}

export function isOwnTransformTransition(event) {
  return event.target === event.currentTarget && event.propertyName === "transform";
}
