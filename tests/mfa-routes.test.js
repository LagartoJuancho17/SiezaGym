import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/firebase/admin", () => ({ getAdminAuth: vi.fn() }));
vi.mock("@/lib/mfa/mailer", () => ({
  hayCorreoConfigurado: vi.fn(),
  permiteConsola: vi.fn(),
  mandarCodigo: vi.fn(),
}));
vi.mock("@/lib/mfa/passwords", () => ({ verificarPassword: vi.fn() }));
vi.mock("@/lib/mfa/store", () => ({
  guardarDesafio: vi.fn(),
  borrarDesafio: vi.fn(),
  pedirTurno: vi.fn(),
  consumirDesafio: vi.fn(),
}));
vi.mock("@/lib/users/users", () => ({ ensureUserProfile: vi.fn() }));

import { getAdminAuth } from "@/lib/firebase/admin";
import { hayCorreoConfigurado, permiteConsola, mandarCodigo } from "@/lib/mfa/mailer";
import { verificarPassword } from "@/lib/mfa/passwords";
import { guardarDesafio, borrarDesafio, pedirTurno, consumirDesafio } from "@/lib/mfa/store";
import { ensureUserProfile } from "@/lib/users/users";
import { POST as start } from "@/app/api/mfa/start/route";
import { POST as verify } from "@/app/api/mfa/verify/route";

function request(body) {
  return new Request("https://example.test/api/mfa", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const admin = { createUser: vi.fn(), getUser: vi.fn(), createCustomToken: vi.fn() };

beforeEach(() => {
  vi.clearAllMocks();
  getAdminAuth.mockReturnValue(admin);
  hayCorreoConfigurado.mockReturnValue(true);
  permiteConsola.mockReturnValue(false);
  pedirTurno.mockResolvedValue({ ok: true });
  verificarPassword.mockResolvedValue({ ok: true, uid: "u1" });
  admin.createUser.mockResolvedValue({ uid: "u1" });
  admin.getUser.mockResolvedValue({ uid: "u1", email: "a@example.com" });
  admin.createCustomToken.mockResolvedValue("firebase-custom-token");
  mandarCodigo.mockResolvedValue({ ok: true, transporte: "resend" });
  guardarDesafio.mockResolvedValue();
  borrarDesafio.mockResolvedValue();
  ensureUserProfile.mockResolvedValue();
});

describe("/api/mfa/start", () => {
  it("no crea cuentas si falta el transporte de correo", async () => {
    hayCorreoConfigurado.mockReturnValue(false);
    const response = await start(request({
      email: "a@example.com", password: "secreto", modo: "signup",
    }));

    expect(response.status).toBe(503);
    expect(admin.createUser).not.toHaveBeenCalled();
    expect(pedirTurno).not.toHaveBeenCalled();
  });

  it("crea la cuenta y envía el código sin entregar token", async () => {
    const response = await start(request({
      email: "a@example.com", password: "secreto", modo: "signup", displayName: "Ana",
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(admin.createUser).toHaveBeenCalledWith({
      email: "a@example.com", password: "secreto", displayName: "Ana",
    });
    expect(guardarDesafio).toHaveBeenCalledOnce();
    expect(mandarCodigo).toHaveBeenCalledOnce();
    expect(body.desafio).toBeTruthy();
    expect(body).not.toHaveProperty("token");
  });

  it("al fallar el correo elimina el código que no se entregó", async () => {
    mandarCodigo.mockResolvedValue({ ok: false, motivo: "red" });
    const response = await start(request({ email: "a@example.com", password: "secreto" }));

    expect(response.status).toBe(502);
    expect(borrarDesafio).toHaveBeenCalledWith(guardarDesafio.mock.calls[0][0]);
  });

  it("si el correo falla después del alta, explica cómo recuperar la cuenta", async () => {
    mandarCodigo.mockResolvedValue({ ok: false, motivo: "red" });
    const response = await start(request({
      email: "a@example.com", password: "secreto", modo: "signup",
    }));

    expect(response.status).toBe(502);
    expect(admin.createUser).toHaveBeenCalledOnce();
    expect(borrarDesafio).toHaveBeenCalledWith(guardarDesafio.mock.calls[0][0]);
    expect((await response.json()).mensaje).toContain("Iniciar sesión");
  });

  it("la contraseña incorrecta no genera desafío ni mail", async () => {
    verificarPassword.mockResolvedValue({ ok: false, motivo: "credenciales" });
    const response = await start(request({ email: "a@example.com", password: "secreto" }));

    expect(response.status).toBe(401);
    expect(guardarDesafio).not.toHaveBeenCalled();
    expect(mandarCodigo).not.toHaveBeenCalled();
  });
});

describe("/api/mfa/verify", () => {
  it("solo emite token después de consumir un código válido", async () => {
    consumirDesafio.mockResolvedValue({ ok: true, uid: "u1" });
    const response = await verify(request({ desafio: "id1", codigo: "123456" }));

    expect(response.status).toBe(200);
    expect(consumirDesafio).toHaveBeenCalledWith("id1", "123456");
    expect(ensureUserProfile).toHaveBeenCalledOnce();
    expect(await response.json()).toEqual({ token: "firebase-custom-token" });
  });

  it("un código incorrecto no emite token ni crea sesión", async () => {
    consumirDesafio.mockResolvedValue({ ok: false, motivo: "incorrecto", restantes: 4 });
    const response = await verify(request({ desafio: "id1", codigo: "000000" }));

    expect(response.status).toBe(401);
    expect(admin.createCustomToken).not.toHaveBeenCalled();
    expect(ensureUserProfile).not.toHaveBeenCalled();
  });
});
