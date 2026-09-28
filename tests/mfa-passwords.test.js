import { afterEach, describe, expect, it, vi } from "vitest";
import { verificarPassword } from "@/lib/mfa/passwords";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("verificarPassword", () => {
  it("descarta el token emitido por Firebase y solo devuelve el uid", async () => {
    vi.stubEnv("FIREBASE_WEB_API_KEY", "clave-publica-de-prueba");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        localId: "u1",
        idToken: "no-debe-salir",
        refreshToken: "tampoco-debe-salir",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    expect(await verificarPassword("a@example.com", "secreto")).toEqual({ ok: true, uid: "u1" });
    const [, options] = fetchMock.mock.calls[0];
    // false a propósito: no hace falta el ID token acá, y no pedirlo es una
    // capa más de defensa. Verificado contra el proyecto real que Identity
    // Toolkit lo acepta igual y sigue devolviendo `localId`.
    expect(JSON.parse(options.body)).toEqual({
      email: "a@example.com",
      password: "secreto",
      returnSecureToken: false,
    });
  });

  it("no distingue email desconocido de contraseña errónea", async () => {
    vi.stubEnv("FIREBASE_WEB_API_KEY", "clave-publica-de-prueba");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: { message: "INVALID_LOGIN_CREDENTIALS" } }),
    }));
    expect(await verificarPassword("a@example.com", "secreto")).toEqual({
      ok: false, motivo: "credenciales",
    });
  });
});
