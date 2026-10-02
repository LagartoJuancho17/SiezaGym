import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";

const verifySessionCookie = vi.fn();
const cookieGet = vi.fn();
const docGet = vi.fn();

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: cookieGet }),
}));
vi.mock("@/lib/firebase/admin", () => ({
  getAdminAuth: () => ({ verifySessionCookie }),
}));
vi.mock("@/lib/firebase/firestore", () => ({
  getDb: () => ({ collection: () => ({ doc: () => ({ get: docGet }) }) }),
}));

const { getCurrentUser } = await import("@/lib/firebase/session.js");
const { getUserProfile } = await import("@/lib/users/users.js");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getCurrentUser (comportamiento intacto)", () => {
  it("devuelve null sin cookie y no llama a Firebase", async () => {
    cookieGet.mockReturnValue(undefined);
    expect(await getCurrentUser()).toBeNull();
    expect(verifySessionCookie).not.toHaveBeenCalled();
  });

  it("verifica con checkRevoked=true", async () => {
    cookieGet.mockReturnValue({ value: "abc" });
    verifySessionCookie.mockResolvedValue({ uid: "u1" });
    expect(await getCurrentUser()).toEqual({ uid: "u1" });
    expect(verifySessionCookie).toHaveBeenCalledWith("abc", true);
  });

  it("devuelve null si la cookie fue revocada o es inválida", async () => {
    cookieGet.mockReturnValue({ value: "bad" });
    verifySessionCookie.mockRejectedValue(new Error("revoked"));
    expect(await getCurrentUser()).toBeNull();
  });
});

describe("getUserProfile (comportamiento intacto)", () => {
  it("devuelve null si el doc no existe", async () => {
    docGet.mockResolvedValue({ exists: false });
    expect(await getUserProfile("u1")).toBeNull();
  });

  it("devuelve null y no revienta si Firestore falla", async () => {
    docGet.mockRejectedValue(new Error("boom"));
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(await getUserProfile("u1")).toBeNull();
  });
});

// cache() solo memoiza dentro de un render de servidor de React, así que vitest no
// puede medir el dedupe real. Este contrato evita que alguien lo quite sin darse cuenta.
describe("contrato de dedupe por request", () => {
  it.each([
    ["lib/firebase/session.js", "getCurrentUser"],
    ["lib/users/users.js", "getUserProfile"],
  ])("%s envuelve %s con cache() de react", (file, name) => {
    const src = readFileSync(file, "utf8");
    expect(src).toMatch(/import \{ cache \} from "react"/);
    expect(src).toMatch(new RegExp(`export const ${name} = cache\\(`));
  });
});
