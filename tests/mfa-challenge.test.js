import { describe, expect, it, vi } from "vitest";
import {
  INTENTOS_MAX,
  LARGO_CODIGO,
  PEDIDOS_MAX,
  VENTANA_MS,
  VIGENCIA_MS,
  claveThrottle,
  generarCodigo,
  hashear,
  limpiarCodigo,
  normalizarEmail,
  nuevoDesafio,
  nuevoID,
  revisar,
  revisarPedidos,
} from "@/lib/mfa/challenge";

const AHORA = 1_700_000_000_000;

function desafio(extra = {}) {
  const { codigo, documento } = nuevoDesafio({
    uid: "u1",
    email: "tobias@example.com",
    modo: "signin",
    ahora: AHORA,
  });
  return { codigo, documento: { ...documento, ...extra } };
}

describe("generarCodigo", () => {
  it("son seis dígitos, siempre", () => {
    for (let i = 0; i < 300; i += 1) {
      const codigo = generarCodigo();
      expect(codigo).toHaveLength(LARGO_CODIGO);
      expect(codigo).toMatch(/^\d{6}$/);
    }
  });

  // Sin el padStart, un sorteo de 42 sale como "42" y el usuario ve un código
  // de dos dígitos que nunca va a coincidir con los seis casilleros.
  it("rellena con ceros a la izquierda", () => {
    expect(String(7).padStart(LARGO_CODIGO, "0")).toBe("000007");
    expect(generarCodigo()).toMatch(/^\d{6}$/);
  });

  it("no repite el mismo código todo el tiempo", () => {
    const vistos = new Set(Array.from({ length: 200 }, generarCodigo));
    expect(vistos.size).toBeGreaterThan(150);
  });
});

describe("nuevoDesafio", () => {
  it("no guarda el código en claro en ninguna parte del documento", () => {
    const { codigo, documento } = desafio();
    expect(JSON.stringify(documento)).not.toContain(codigo);
  });

  it("guarda el email normalizado", () => {
    const { documento } = nuevoDesafio({ uid: "u1", email: "  Tobias@Example.COM ", modo: "signin" });
    expect(documento.email).toBe("tobias@example.com");
  });

  it("vence diez minutos después", () => {
    const { documento } = desafio();
    expect(documento.venceEn - documento.creadoEn).toBe(VIGENCIA_MS);
  });

  it("arranca sin intentos gastados", () => {
    expect(desafio().documento.intentos).toBe(0);
  });

  // Dos desafíos con el mismo código tienen distinto hash. Sin sal, un hash
  // repetido en la base delataría que dos usuarios tienen el mismo código.
  it("cada desafío tiene su propia sal", () => {
    const a = desafio().documento;
    const b = desafio().documento;
    expect(a.sal).not.toBe(b.sal);
  });

  it("el id es largo y no adivinable", () => {
    const ids = new Set(Array.from({ length: 100 }, nuevoID));
    expect(ids.size).toBe(100);
    expect(nuevoID().length).toBeGreaterThanOrEqual(30);
  });
});

describe("revisar", () => {
  it("acepta el código correcto y dice de quién es", () => {
    const { codigo, documento } = desafio();
    expect(revisar(documento, codigo, AHORA)).toEqual({ ok: true, uid: "u1", modo: "signin" });
  });

  it("rechaza el incorrecto y cuenta el intento", () => {
    const { codigo, documento } = desafio();
    const otro = codigo === "000000" ? "111111" : "000000";
    const veredicto = revisar(documento, otro, AHORA);

    expect(veredicto.ok).toBe(false);
    expect(veredicto.motivo).toBe("incorrecto");
    expect(veredicto.intentos).toBe(1);
    expect(veredicto.restantes).toBe(INTENTOS_MAX - 1);
  });

  // El usuario copia "123 456" del mail, o pega la frase entera. Eso no es un
  // intento fallido: es el mismo código con basura alrededor.
  it("ignora espacios, guiones y texto alrededor", () => {
    const { codigo, documento } = desafio();
    const partido = `${codigo.slice(0, 3)} - ${codigo.slice(3)}`;

    expect(revisar(documento, partido, AHORA).ok).toBe(true);
    expect(revisar(documento, `Tu código es ${codigo}.`, AHORA).ok).toBe(true);
  });

  it("un código de menos dígitos no gasta intento", () => {
    const { codigo, documento } = desafio();
    const veredicto = revisar(documento, codigo.slice(0, 3), AHORA);

    expect(veredicto.motivo).toBe("incompleto");
    expect(veredicto.intentos).toBe(0);
  });

  it("vencido no entra ni con el código bueno", () => {
    const { codigo, documento } = desafio();
    expect(revisar(documento, codigo, AHORA + VIGENCIA_MS).motivo).toBe("vencido");
    expect(revisar(documento, codigo, AHORA + VIGENCIA_MS - 1).ok).toBe(true);
  });

  it("quemado no entra ni con el código bueno", () => {
    const { codigo, documento } = desafio({ intentos: INTENTOS_MAX });
    expect(revisar(documento, codigo, AHORA).motivo).toBe("quemado");
  });

  // El último intento fallido no vuelve como "incorrecto, te quedan 0": vuelve
  // como quemado, que es lo que hay que decirle al usuario.
  it("el último intento fallido lo quema", () => {
    const { codigo, documento } = desafio({ intentos: INTENTOS_MAX - 1 });
    const otro = codigo === "000000" ? "111111" : "000000";

    expect(revisar(documento, otro, AHORA).motivo).toBe("quemado");
  });

  it("un desafío que no existe no explota", () => {
    expect(revisar(null, "123456", AHORA)).toEqual({ ok: false, motivo: "inexistente" });
  });

  it("un documento sin hash no entra", () => {
    const { codigo, documento } = desafio();
    expect(revisar({ ...documento, codigoHash: undefined }, codigo, AHORA).ok).toBe(false);
  });

  // La sal es parte del secreto: el mismo código con otra sal da otro hash.
  it("el código no sirve con la sal de otro desafío", () => {
    const uno = desafio();
    const otro = desafio();
    expect(revisar({ ...otro.documento, sal: uno.documento.sal }, otro.codigo, AHORA).ok).toBe(false);
  });
});

describe("hashear", () => {
  it("el mismo código y la misma sal dan siempre el mismo hash", () => {
    expect(hashear("123456", "sal")).toBe(hashear("123456", "sal"));
  });

  it("distinta sal, distinto hash", () => {
    expect(hashear("123456", "sal-a")).not.toBe(hashear("123456", "sal-b"));
  });
});

describe("limpiarCodigo", () => {
  it.each([
    ["123456", "123456"],
    [" 123 456 ", "123456"],
    ["123-456", "123456"],
    ["Tu código es 123456.", "123456"],
    ["", ""],
    [null, ""],
    [undefined, ""],
    ["abcdef", ""],
  ])("%s -> %s", (entrada, esperado) => {
    expect(limpiarCodigo(entrada)).toBe(esperado);
  });
});

describe("claveThrottle", () => {
  it("el mismo email da la misma clave, con o sin mayúsculas", () => {
    expect(claveThrottle("Tobias@Example.com")).toBe(claveThrottle(" tobias@example.com "));
  });

  it("no lleva el email adentro: es un hash", () => {
    const clave = claveThrottle("tobias@example.com");
    expect(clave).not.toContain("tobias");
    expect(clave).toMatch(/^[0-9a-f]+$/);
  });

  it("emails distintos, claves distintas", () => {
    expect(claveThrottle("a@b.com")).not.toBe(claveThrottle("c@d.com"));
  });
});

describe("normalizarEmail", () => {
  it.each([
    ["  Tobias@Example.COM ", "tobias@example.com"],
    ["", ""],
    [null, ""],
  ])("%s -> %s", (entrada, esperado) => {
    expect(normalizarEmail(entrada)).toBe(esperado);
  });
});

describe("revisarPedidos", () => {
  it("el primer pedido siempre pasa", () => {
    const veredicto = revisarPedidos(null, AHORA);
    expect(veredicto.ok).toBe(true);
    expect(veredicto.registro).toEqual({ desde: AHORA, pedidos: 1 });
  });

  it("suma dentro de la ventana sin mover el inicio", () => {
    const veredicto = revisarPedidos({ desde: AHORA, pedidos: 3 }, AHORA + 60_000);
    expect(veredicto.ok).toBe(true);
    expect(veredicto.registro).toEqual({ desde: AHORA, pedidos: 4 });
  });

  it("corta en el tope", () => {
    const veredicto = revisarPedidos({ desde: AHORA, pedidos: PEDIDOS_MAX }, AHORA + 60_000);
    expect(veredicto.ok).toBe(false);
    expect(veredicto.motivo).toBe("demasiados");
    expect(veredicto.esperarMs).toBe(VENTANA_MS - 60_000);
  });

  // La ventana es fija y no corrediza: pasados los quince minutos el contador
  // vuelve a cero. Si se moviera con cada pedido, alguien bloqueado quedaría
  // bloqueado para siempre por seguir intentando.
  it("pasada la ventana arranca de nuevo", () => {
    const veredicto = revisarPedidos({ desde: AHORA, pedidos: PEDIDOS_MAX }, AHORA + VENTANA_MS);
    expect(veredicto.ok).toBe(true);
    expect(veredicto.registro).toEqual({ desde: AHORA + VENTANA_MS, pedidos: 1 });
  });

  it("deja pasar exactamente el tope y no uno más", () => {
    const permitidos = [];
    let registro = null;

    for (let i = 0; i < PEDIDOS_MAX + 3; i += 1) {
      const veredicto = revisarPedidos(registro, AHORA + i * 1000);
      if (veredicto.ok) {
        permitidos.push(i);
        registro = veredicto.registro;
      }
    }

    expect(permitidos).toHaveLength(PEDIDOS_MAX);
  });
});

describe("transporte del mail", () => {
  // Importación dinámica en cada caso: el módulo lee process.env al llamarse,
  // pero `permiteConsola` se evalúa por llamada, así que alcanza con moverla.
  async function mailer() {
    return import("@/lib/mfa/mailer");
  }

  it("con clave de Resend está configurado", async () => {
    const { hayCorreoConfigurado } = await mailer();
    process.env.RESEND_API_KEY = "re_deMentira";
    expect(hayCorreoConfigurado()).toBe(true);
    delete process.env.RESEND_API_KEY;
    expect(hayCorreoConfigurado()).toBe(false);
  });

  it("en desarrollo el log del servidor sirve de transporte", async () => {
    const { permiteConsola } = await mailer();
    expect(permiteConsola()).toBe(true);
  });

  // El caso que importa: un deploy sin la clave no puede dejar el código en los
  // logs de Vercel y decir que salió bien. Nadie lee esos logs desde el celular.
  it("en producción sin clave no manda nada y lo dice", async () => {
    const { mandarCodigo } = await mailer();
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.RESEND_API_KEY;

    try {
      const resultado = await mandarCodigo({ email: "a@b.com", codigo: "123456", minutos: 10 });
      expect(resultado.ok).toBe(false);
      expect(resultado.motivo).toBe("sin-correo");
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("en producción exige remitente verificado además de la clave", async () => {
    const { hayCorreoConfigurado } = await mailer();
    vi.stubEnv("NODE_ENV", "production");
    process.env.RESEND_API_KEY = "re_deMentira";
    delete process.env.RESEND_FROM;

    try {
      expect(hayCorreoConfigurado()).toBe(false);
      process.env.RESEND_FROM = "SiezaGym <acceso@sieza.example>";
      expect(hayCorreoConfigurado()).toBe(true);
    } finally {
      delete process.env.RESEND_API_KEY;
      delete process.env.RESEND_FROM;
      vi.unstubAllEnvs();
    }
  });

  it("en desarrollo sin clave devuelve el código por consola", async () => {
    const { mandarCodigo } = await mailer();
    delete process.env.RESEND_API_KEY;

    const resultado = await mandarCodigo({ email: "a@b.com", codigo: "123456", minutos: 10 });
    expect(resultado).toEqual({ ok: true, transporte: "consola" });
  });
});
