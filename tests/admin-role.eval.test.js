import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

describe("admin role access evaluation", () => {
  it("checks the authenticated user's server profile at every admin entry point", () => {
    for (const path of ["app/admin/page.js", "app/dashboard/page.js", "app/(app)/page.js"]) {
      const source = read(path);
      expect(source, `${path} must load the server profile`).toContain("getUserProfile(user.uid)");
      expect(source, `${path} must pass that profile to access control`).toContain("isAdminUser(user, profile)");
    }
  });

  it("does not present a fixed email list as the only authorized administrators", () => {
    expect(read("app/admin/page.js")).not.toContain("ADMIN_EMAILS.map");
  });
});
