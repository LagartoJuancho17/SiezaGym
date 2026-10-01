import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const loginSource = read("app/login/page.js");
const registerSource = read("app/register/page.js");
const formSource = read("components/LoginForm.js");
const cssSource = read("app/design2.css");

describe("Entrar y crear cuenta", () => {
  it("las dos pantallas usan el fondo del tema", () => {
    // Entrar no puede sentirse como otro producto.
    for (const source of [loginSource, registerSource]) {
      expect(source).toContain("<ThemeRoot>");
      expect(source).toContain("<Backdrop />");
      expect(source).toContain('className="d2-page d2-authpage"');
    }
  });

  it("no llevan barra de pestañas", () => {
    // Sin sesión todavía no hay a dónde navegar.
    for (const source of [loginSource, registerSource]) {
      expect(source).not.toContain("TabBar");
    }
  });

  it("cada una abre en su modo", () => {
    expect(registerSource).toContain('initialMode={"signup"}');
    expect(loginSource).toContain('params.mode === "signup" ? "signup" : "signin"');
  });

  it("si ya hay sesión no se muestran", () => {
    for (const source of [loginSource, registerSource]) {
      expect(source).toContain("if (user) redirect(nextUrl)");
    }
  });

  it("respetan a dónde volver después de entrar", () => {
    for (const source of [loginSource, registerSource]) {
      expect(source).toContain('params.next || "/"');
    }
  });
});

describe("El formulario", () => {
  it("conserva la autenticación que ya funcionaba", () => {
    for (const fn of [
      "createUserWithEmailAndPassword",
      "signInWithEmailAndPassword",
      "signInWithPopup",
      "persistSession",
    ]) {
      expect(formSource).toContain(fn);
    }
    expect(formSource).toContain('fetch("/api/session/login"');
  });

  it("traduce los códigos de Firebase en vez de mostrarlos", () => {
    // "auth/invalid-credential" no le dice nada a nadie.
    expect(formSource).toContain("Email o contraseña incorrectos.");
    expect(formSource).toContain("Ya existe una cuenta con este email.");
    expect(formSource).toContain("El navegador bloqueó la ventana de Google.");
  });

  it("no crea la cuenta si las contraseñas no coinciden", () => {
    // La comprobación corta antes de llamar a Firebase.
    expect(formSource).toContain("Las dos contraseñas no coinciden.");
    expect(formSource).toContain("La contraseña tiene que tener al menos 6 caracteres.");
  });

  it("entrar y registrarse viven en la misma pantalla", () => {
    // Mandar a otra página para agregar un campo obliga a reescribir el email.
    expect(formSource).toContain('role="tablist"');
    expect(formSource).toContain("aria-selected={signup}");
    expect(formSource).toContain("window.history.replaceState");
  });

  it("un solo botón muestra las dos contraseñas", () => {
    // Son la misma contraseña: dos interruptores para lo mismo confunden.
    expect(formSource).toContain("aria-pressed={visible}");
    expect(formSource.match(/type=\{visible \? "text" : "password"\}/g)).toHaveLength(2);
  });

  it("el error se anuncia como error", () => {
    expect(formSource).toContain('role="alert"');
  });

  it("deja que el navegador ofrezca la contraseña guardada", () => {
    expect(formSource).toContain('autoComplete="email"');
    expect(formSource).toContain('signup ? "new-password" : "current-password"');
  });

  it("no fija colores a mano, salvo la marca de Google", () => {
    // Google no permite recolorear su marca; es la única excepción.
    const sinGoogle = formSource.slice(formSource.indexOf("export default function"));
    expect(sinGoogle).not.toMatch(/text-white\b|bg-white\b|#[0-9a-fA-F]{6}/);
    expect(formSource).toContain("#4285F4");
  });
});

describe("Estilo", () => {
  it("la pantalla se centra pero puede desplazarse", () => {
    // Con el teclado abierto en un teléfono, un centrado rígido esconde el
    // botón de entrar.
    expect(cssSource).toMatch(/\.d2-authpage \{[^}]*justify-content: center/);
    expect(cssSource).toMatch(/\.d2-authpage \{[^}]*min-height: 100svh/);
  });

  it("las dos pestañas se reparten el ancho", () => {
    expect(cssSource).toMatch(/\.d2-auth-modes \.d2-seg \{ flex: 1/);
  });

  it("el botón principal usa el sólido del tema", () => {
    expect(cssSource).toMatch(/\.d2-submit \{[^}]*background: var\(--d2-ink\)/);
  });

  it("los campos no disparan el zoom de iOS", () => {
    expect(cssSource).toMatch(/\.d2-input \{[^}]*font-size: max\(16px/);
  });
});
