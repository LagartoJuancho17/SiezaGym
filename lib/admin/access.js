const FALLBACK_ADMIN_EMAILS = [
  "totoarr17@gmail.com",
  "valentinsierradw@gmail.com",
];

function configuredAdminEmails() {
  const configured = String(process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return configured.length > 0 ? configured : FALLBACK_ADMIN_EMAILS;
}

export const ADMIN_EMAILS = Object.freeze(configuredAdminEmails());

export function isAdminEmail(email) {
  return ADMIN_EMAILS.includes(String(email || "").trim().toLowerCase());
}

export function isAdminUser(user) {
  return isAdminEmail(user?.email);
}

export function requireAdmin(user) {
  if (!isAdminUser(user)) {
    throw new Error("No tenés permiso para entrar al panel de administración.");
  }

  return user;
}
