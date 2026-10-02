import { describe, expect, it } from "vitest";
import { ADMIN_EMAILS, isAdminEmail, isAdminUser } from "@/lib/admin/access";

describe("admin access", () => {
  it("keeps the configured administrator allowlist", () => {
    expect(ADMIN_EMAILS).toEqual(["totoarr17@gmail.com", "valentinsierradw@gmail.com"]);
    expect(isAdminEmail("totoarr17@gmail.com")).toBe(true);
    expect(isAdminEmail("VALENTINSIERRADW@GMAIL.COM")).toBe(true);
    expect(isAdminEmail("otra-persona@gmail.com")).toBe(false);
    expect(isAdminUser({ email: "otra-persona@gmail.com" })).toBe(false);
  });

  it("allows a server-loaded admin role only for the signed-in account", () => {
    const user = { uid: "user-1", email: "otra-persona@gmail.com" };
    expect(isAdminUser(user, { uid: "user-1", isAdmin: true })).toBe(true);
    expect(isAdminUser(user, { uid: "user-2", isAdmin: true })).toBe(false);
    expect(isAdminUser(user, { uid: "user-1", isAdmin: false })).toBe(false);
    expect(isAdminUser(user)).toBe(false);
  });
});
