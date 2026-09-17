import { afterEach, describe, expect, it, vi } from "vitest";

const responses = vi.hoisted(() => ({
  rewrite: vi.fn((url) => ({ type: "rewrite", url: String(url) })),
  redirect: vi.fn((url) => ({ type: "redirect", url: String(url) })),
  next: vi.fn(() => ({ type: "next" })),
}));

vi.mock("next/server", () => ({ NextResponse: responses }));

import { proxy, config } from "@/proxy";

function request(pathname, session) {
  return {
    url: `http://localhost:3000${pathname}`,
    nextUrl: { pathname },
    cookies: { get: vi.fn(() => (session ? { value: session } : undefined)) },
  };
}

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("atajo de vista local en la URL raíz", () => {
  it("reescribe / al preview móvil solo con la bandera explícita", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("D2_PREVIEW", "true");

    expect(proxy(request("/"))).toEqual({
      type: "rewrite",
      url: "http://localhost:3000/design-preview?viewport=390",
    });
    expect(responses.rewrite).toHaveBeenCalledTimes(1);
    expect(responses.redirect).not.toHaveBeenCalled();
  });

  it.each([
    ["production", "true"],
    ["development", "false"],
    ["development", ""],
  ])("mantiene la autenticación normal con NODE_ENV=%s y D2_PREVIEW=%j", (nodeEnv, preview) => {
    vi.stubEnv("NODE_ENV", nodeEnv);
    vi.stubEnv("D2_PREVIEW", preview);

    expect(proxy(request("/"))).toEqual({
      type: "redirect",
      url: "http://localhost:3000/login?next=%2F",
    });
    expect(responses.rewrite).not.toHaveBeenCalled();
  });

  it("no cambia las rutas protegidas del dashboard", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("D2_PREVIEW", "true");

    expect(proxy(request("/dashboard", "session-cookie"))).toEqual({ type: "next" });
    expect(responses.rewrite).not.toHaveBeenCalled();
    expect(config.matcher).toContain("/");
    expect(config.matcher).toContain("/dashboard/:path*");
  });
});
