import { beforeEach, describe, expect, it, vi } from "vitest";
import { nuevoDesafio } from "@/lib/mfa/challenge";

vi.mock("@/lib/firebase/firestore", () => ({ getDb: vi.fn() }));

import { getDb } from "@/lib/firebase/firestore";
import { consumirDesafio } from "@/lib/mfa/store";

const AHORA = 1_700_000_000_000;
let documento;
let transacciones;
let actualizaciones;
let eliminaciones;

beforeEach(() => {
  documento = null;
  transacciones = 0;
  actualizaciones = [];
  eliminaciones = [];

  const db = {
    collection: (name) => ({ doc: (id) => ({ name, id }) }),
    runTransaction: async (callback) => {
      transacciones += 1;
      return callback({
        get: async () => ({ exists: documento !== null, data: () => documento }),
        update: (_ref, patch) => {
          actualizaciones.push(patch);
          documento = { ...documento, ...patch };
        },
        delete: (ref) => {
          eliminaciones.push(ref.id);
          documento = null;
        },
      });
    },
  };
  getDb.mockReturnValue(db);
});

describe("consumirDesafio", () => {
  it("un código correcto sirve una sola vez", async () => {
    const { codigo, documento: nuevo } = nuevoDesafio({
      uid: "u1", email: "a@example.com", modo: "signin", ahora: AHORA,
    });
    documento = nuevo;

    expect(await consumirDesafio("id1", codigo, AHORA)).toEqual({ ok: true, uid: "u1", modo: "signin" });
    expect(await consumirDesafio("id1", codigo, AHORA)).toEqual({ ok: false, motivo: "inexistente" });
    expect(transacciones).toBe(2);
    expect(eliminaciones).toEqual(["id1"]);
  });

  it("cuenta cada error dentro de la transacción y quema al quinto", async () => {
    const { codigo, documento: nuevo } = nuevoDesafio({
      uid: "u1", email: "a@example.com", modo: "signin", ahora: AHORA,
    });
    documento = nuevo;
    const incorrecto = codigo === "000000" ? "111111" : "000000";

    for (let intento = 1; intento <= 5; intento += 1) {
      const resultado = await consumirDesafio("id1", incorrecto, AHORA);
      expect(resultado.ok).toBe(false);
      expect(resultado.motivo).toBe(intento === 5 ? "quemado" : "incorrecto");
    }

    expect(transacciones).toBe(5);
    expect(actualizaciones).toEqual([
      { intentos: 1 }, { intentos: 2 }, { intentos: 3 }, { intentos: 4 },
    ]);
    expect(eliminaciones).toEqual(["id1"]);
  });

  it("un código incompleto no gasta intento", async () => {
    documento = nuevoDesafio({ uid: "u1", email: "a@example.com", modo: "signin", ahora: AHORA }).documento;
    expect((await consumirDesafio("id1", "123", AHORA)).motivo).toBe("incompleto");
    expect(actualizaciones).toEqual([]);
    expect(eliminaciones).toEqual([]);
  });
});
