// Arte del onboarding: la mancha Brasa → naranja vista a través de vidrio
// acanalado, con grano. Corre en un shader de p5 a la densidad real de la
// pantalla (3x en iPhone), así cada píxel se calcula y nada se ve pixelado.
//
// La app (OnboardingView.swift) manda la posición de la mancha de cada pantalla
// con `window.sieza.mostrar({ x, y, ancho, alto, quieto })`; las posiciones
// viven en Swift (ArteOnboarding.mancha) y acá solo se dibujan.

(function (raiz) {
  "use strict";

  // ── Lógica pura (se prueba en tests/ios-onboarding-arte.test.js) ─────────

  const MANCHA_INICIAL = { x: 0.68, y: 0.36, ancho: 0.95, alto: 0.42 };

  const limitar = (valor, min, max, defecto) =>
    Number.isFinite(valor) ? Math.min(max, Math.max(min, valor)) : defecto;

  /** Deja la mancha dentro de rangos que se ven bien; lo inválido cae al inicio. */
  function normalizarMancha(entrada) {
    const m = entrada || {};
    return {
      x: limitar(Number(m.x), 0, 1, MANCHA_INICIAL.x),
      y: limitar(Number(m.y), 0, 1, MANCHA_INICIAL.y),
      ancho: limitar(Number(m.ancho), 0.2, 2, MANCHA_INICIAL.ancho),
      alto: limitar(Number(m.alto), 0.1, 1.5, MANCHA_INICIAL.alto),
    };
  }

  /**
   * Acerca `actual` a `objetivo` con un suavizado exponencial que no depende
   * de los cuadros por segundo: tras `tau` segundos recorrió ~63% del camino.
   */
  function acercar(actual, objetivo, dt, tau) {
    const k = tau <= 0 ? 1 : 1 - Math.exp(-Math.max(0, dt) / tau);
    const out = {};
    for (const clave of Object.keys(objetivo)) {
      out[clave] = actual[clave] + (objetivo[clave] - actual[clave]) * k;
    }
    return out;
  }

  /** True cuando la mancha ya llegó (a menos de medio píxel en un iPhone). */
  function quieta(actual, objetivo) {
    return Object.keys(objetivo).every((clave) => Math.abs(actual[clave] - objetivo[clave]) < 0.0005);
  }

  raiz.SiezaArte = { MANCHA_INICIAL, normalizarMancha, acercar, quieta };

  if (typeof raiz.p5 !== "function") return; // en Node (pruebas) no hay p5

  // ── Shader ──────────────────────────────────────────────────────────────

  const VERTICES = `
    precision highp float;
    attribute vec3 aPosition;
    void main() {
      vec4 p = vec4(aPosition, 1.0);
      p.xy = p.xy * 2.0 - 1.0;
      gl_Position = p;
    }`;

  const FRAGMENTOS = `
    precision highp float;
    uniform vec2 uRes;      // tamaño del lienzo en píxeles reales
    uniform float uDpr;     // píxeles por punto
    uniform vec2 uCentro;   // centro de la mancha, 0..1, y desde arriba
    uniform vec2 uTam;      // ancho y alto de la mancha, relativos a la pantalla
    uniform float uTiempo;  // segundos, para el vaivén lento y el grano
    uniform float uFranja;  // ancho de cada canal del vidrio, en puntos

    const vec3 BRASA = vec3(1.0, 50.0 / 255.0, 1.0 / 255.0);
    const vec3 NARANJA = vec3(1.0, 118.0 / 255.0, 1.0 / 255.0);
    const float PI = 3.14159265;

    float azar(vec2 p) {
      p = fract(p * vec2(443.897, 441.423));
      p += dot(p, p.yx + 19.19);
      return fract((p.x + p.y) * p.x);
    }

    // El brillo sin vidrio: núcleo naranja, Brasa alrededor, se apaga al negro.
    vec3 brillo(vec2 px) {
      vec2 centro = uCentro * uRes;
      vec2 radio = 0.5 * uTam * uRes;
      vec2 d = (px - centro) / radio;
      float i = exp(-dot(d, d) * 1.5);
      vec3 color = mix(BRASA * 0.92, NARANJA, smoothstep(0.4, 1.0, i));
      return color * smoothstep(0.012, 0.75, i);
    }

    void main() {
      vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
      float ancho = uFranja * uDpr;
      float local = fract(px.x / ancho);
      float canal = floor(px.x / ancho);

      // Cada canal es una lente cilíndrica: muestra una tajada más ancha de lo
      // que hay detrás, invertida. Eso arma las franjas de la referencia.
      float muestraX = (canal + 0.5) * ancho - (local - 0.5) * ancho * 3.4;
      vec3 color = brillo(vec2(muestraX, px.y));
      float luz = dot(color, vec3(0.3, 0.55, 0.15));

      // Volumen del canal: más oscuro en los bordes, junta fina antialiasada y
      // un reflejo angosto del lado izquierdo.
      color *= 0.6 + 0.4 * sin(local * PI);
      float aJunta = min(local, 1.0 - local) * ancho;
      color *= mix(0.62, 1.0, smoothstep(0.0, 1.1 * uDpr, aJunta));
      float reflejo = exp(-pow((local - 0.24) * ancho / (0.9 * uDpr), 2.0));
      color += reflejo * 0.16 * luz;

      // Grano de película, un valor por píxel real, más visible sobre el color.
      float grano = azar(gl_FragCoord.xy + fract(uTiempo * 0.37) * vec2(97.0, 53.0)) - 0.5;
      color += grano * (0.014 + 0.06 * luz);

      // Dither de medio escalón para que el degradado no haga bandas.
      color += (azar(gl_FragCoord.yx + 7.0) - 0.5) / 255.0;

      gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
    }`;

  // ── Boceto ──────────────────────────────────────────────────────────────

  new raiz.p5(function (p) {
    let sombreador;
    let actual = { ...MANCHA_INICIAL };
    let objetivo = { ...MANCHA_INICIAL };
    let sinMovimiento = false;
    let avisado = false;
    let segundos = 0;

    raiz.sieza = {
      mostrar(entrada) {
        objetivo = normalizarMancha(entrada);
        sinMovimiento = Boolean(entrada && entrada.quieto);
        // Antes del primer cuadro no hay transición: arranca donde tiene que estar.
        if (!avisado || sinMovimiento) actual = { ...objetivo };
        p.frameRate(60);
        p.loop();
      },
    };

    p.setup = function () {
      p.pixelDensity(Math.min(raiz.devicePixelRatio || 1, 3));
      p.createCanvas(raiz.innerWidth, raiz.innerHeight, p.WEBGL);
      p.noStroke();
      sombreador = p.createShader(VERTICES, FRAGMENTOS);
    };

    p.windowResized = function () {
      p.resizeCanvas(raiz.innerWidth, raiz.innerHeight);
    };

    p.draw = function () {
      const dt = Math.min(p.deltaTime / 1000, 0.1);
      if (!sinMovimiento) segundos += dt;
      actual = acercar(actual, objetivo, dt, 0.32);

      const vaiven = sinMovimiento ? 0 : 0.012;
      p.shader(sombreador);
      sombreador.setUniform("uRes", [p.width * p.pixelDensity(), p.height * p.pixelDensity()]);
      sombreador.setUniform("uDpr", p.pixelDensity());
      sombreador.setUniform("uCentro", [
        actual.x + vaiven * Math.sin(segundos * 0.35),
        actual.y + vaiven * Math.cos(segundos * 0.27),
      ]);
      sombreador.setUniform("uTam", [actual.ancho, actual.alto]);
      sombreador.setUniform("uTiempo", segundos);
      sombreador.setUniform("uFranja", 15);
      p.rect(0, 0, p.width, p.height);

      if (!avisado) {
        avisado = true;
        raiz.webkit?.messageHandlers?.sieza?.postMessage("listo");
      }

      // Con la mancha quieta alcanza con 30 cuadros (el vaivén es lento); con
      // "reducir movimiento" se dibuja una vez y se detiene.
      if (quieta(actual, objetivo)) {
        if (sinMovimiento) p.noLoop();
        else p.frameRate(30);
      }
    };
  });
})(typeof window !== "undefined" ? window : globalThis);
