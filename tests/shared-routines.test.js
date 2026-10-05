import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/firebase/admin", () => ({ getAdminAuth: vi.fn() }));
vi.mock("@/lib/firebase/firestore", () => ({ getDb: vi.fn() }));
vi.mock("@/lib/users/users", () => ({ getUserProfile: vi.fn() }));
vi.mock("firebase-admin/firestore", () => ({
  FieldValue: { serverTimestamp: () => "ts", increment: (n) => ({ inc: n }) },
}));

import { getAdminAuth } from "@/lib/firebase/admin";
import { getDb } from "@/lib/firebase/firestore";
import { getUserProfile } from "@/lib/users/users";
import {
  buildSharedSnapshot,
  importableExercises,
  isValidShareId,
  newShareId,
  shareUrl,
} from "@/lib/sharing/sharedRoutines";
import { POST as compartir } from "@/app/api/rutinas/compartir/route";
import { GET as compartida } from "@/app/api/rutinas/compartidas/[id]/route";

const routine = {
  sourceId: "r1",
  name: "  Upper body  ",
  note: "Torso",
  exercises: [
    { exerciseId: "press-de-banca-con-barra", targetSets: 4, targetReps: 6, group: "Fuerza", groupColor: "amber" },
    { exerciseId: "mi-ejercicio", exerciseSource: "custom", targetSets: 3, targetReps: 10 },
  ],
  exerciseNames: { "press-de-banca-con-barra": "Press de banca con barra" },
};

function request(body, token = "token") {
  return new Request("https://example.test/api", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
}

describe("ids y links", () => {
  it("10 caracteres sin letras confusas", () => {
    const id = newShareId();
    expect(isValidShareId(id)).toBe(true);
    expect(id).not.toMatch(/[01lo]/);
    expect(isValidShareId("../../users")).toBe(false);
    expect(shareUrl("abcdefghij")).toBe("https://sieza-gym.vercel.app/r/abcdefghij");
  });
});

describe("lo que se guarda al compartir", () => {
  it("sanea como una rutina propia y guarda dueño y nombres", () => {
    const snapshot = buildSharedSnapshot(routine, { uid: "u1", displayName: "Tobias" });
    expect(snapshot.name).toBe("Upper body");
    expect(snapshot.ownerName).toBe("Tobias");
    expect(snapshot.exercises[0]).toMatchObject({ exerciseId: "press-de-banca-con-barra", targetSets: 4, targetReps: 6, order: 0 });
    expect(snapshot.exerciseNames).toEqual({ "press-de-banca-con-barra": "Press de banca con barra" });
  });

  it("sin nombre o sin ejercicios no se comparte", () => {
    expect(() => buildSharedSnapshot({ ...routine, name: " " }, { uid: "u1" })).toThrow();
    expect(() => buildSharedSnapshot({ ...routine, exercises: [] }, { uid: "u1" })).toThrow();
  });

  it("al copiar quedan afuera los ejercicios propios de otro y los que no están en el catálogo", () => {
    const { exercises } = buildSharedSnapshot(routine, { uid: "u1" });
    const ids = importableExercises(exercises, new Set(["press-de-banca-con-barra", "mi-ejercicio"])).map((e) => e.exerciseId);
    expect(ids).toEqual(["press-de-banca-con-barra"]);
  });
});

describe("API", () => {
  const verifyIdToken = vi.fn();
  const create = vi.fn();
  const get = vi.fn();
  const query = { where: () => query, limit: () => query, get: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    getAdminAuth.mockReturnValue({ verifyIdToken });
    verifyIdToken.mockResolvedValue({ uid: "u1" });
    getUserProfile.mockResolvedValue({ displayName: "Tobias" });
    query.get.mockResolvedValue({ empty: true, docs: [] });
    getDb.mockReturnValue({
      collection: () => ({ ...query, doc: () => ({ create, get }) }),
    });
    create.mockResolvedValue();
  });

  it("compartir sin token es 401 y no escribe nada", async () => {
    const response = await compartir(request(routine, null));
    expect(response.status).toBe(401);
    expect(create).not.toHaveBeenCalled();
  });

  it("con un token falso también es 401", async () => {
    verifyIdToken.mockRejectedValue(new Error("bad"));
    const response = await compartir(request(routine, "falso"));
    expect(response.status).toBe(401);
  });

  it("compartir devuelve el link y guarda el dueño verificado, no el que diga el cuerpo", async () => {
    const response = await compartir(request({ ...routine, ownerId: "otro" }));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.url).toMatch(/^https:\/\/sieza-gym\.vercel\.app\/r\/[a-z2-9]{10}$/);
    expect(create.mock.calls[0][0]).toMatchObject({ ownerId: "u1", ownerName: "Tobias", name: "Upper body" });
  });

  it("leer un link inexistente es 404 y no expone el dueño cuando existe", async () => {
    get.mockResolvedValueOnce({ exists: false });
    const missing = await compartida(new Request("https://x"), { params: Promise.resolve({ id: "abcdefghij" }) });
    expect(missing.status).toBe(404);

    get.mockResolvedValueOnce({
      exists: true,
      id: "abcdefghij",
      data: () => ({ name: "Upper", exercises: [], ownerId: "u1", ownerName: "Tobias" }),
    });
    const found = await compartida(new Request("https://x"), { params: Promise.resolve({ id: "abcdefghij" }) });
    const body = await found.json();
    expect(body.name).toBe("Upper");
    expect(body.ownerId).toBeUndefined();
  });
});
