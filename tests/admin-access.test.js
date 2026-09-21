import { describe, expect, it } from "vitest";
import { ADMIN_EMAILS, isAdminEmail, isAdminUser } from "@/lib/admin/access";

describe("admin access", () => {
  it("allows only the two configured administrators", () => {
    expect(ADMIN_EMAILS).toEqual(["totoarr17@gmail.com", "valentinsierradw@gmail.com"]);
    expect(isAdminEmail("totoarr17@gmail.com")).toBe(true);
    expect(isAdminEmail("VALENTINSIERRADW@GMAIL.COM")).toBe(true);
    expect(isAdminEmail("otra-persona@gmail.com")).toBe(false);
    expect(isAdminUser({ email: "otra-persona@gmail.com" })).toBe(false);
  });
});
