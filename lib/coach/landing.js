const MOBILE_USER_AGENT = /\b(?:iPhone|iPad|iPod|Android|Mobile)\b/i;

export function shouldOpenCoachWorkspace({ profile, userAgent, mobileHint, requestedView }) {
  if (!profile?.isCoach && !profile?.isAdmin) return false;
  if (requestedView === "athlete") return false;
  if (mobileHint === "?1" || MOBILE_USER_AGENT.test(userAgent || "")) return false;

  // Sin una señal de escritorio, conservamos la Home de atleta por seguridad.
  return mobileHint === "?0" || Boolean(userAgent);
}
