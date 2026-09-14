# design2 — sistema de diseño

Rediseño de SiezaGym con estética de vidrio esmerilado. Va pantalla por
pantalla: hoy solo la Home (`/`).

## Cómo está armado

Todo sale de variables CSS. Ningún componente escribe un color, una opacidad ni
un radio a mano — hay un test que lo verifica (`tests/design2-themes.test.js`).

```
app/design2.css              variables, temas y piezas (.d2-glass, .d2-backdrop…)
components/design2/themes.js registro de temas y tema por defecto
components/design2/ThemeRoot.js  aplica data-d2-theme + selector (solo en dev)
```

El sistema vive bajo la clase `.d2` a propósito: las pantallas que todavía no se
rediseñaron siguen con la paleta bordo de `globals.css` y los dos no se pisan.
`components/nav/LegacyChrome.js` saca el navbar viejo de las rutas ya
rediseñadas — su lista `REDESIGNED` es la que hay que ampliar al avanzar.

## Temas

| id      | Qué es                  |
| ------- | ----------------------- |
| `noche` | Negro con degradado (por defecto) |
| `plata` | Gris frío claro         |
| `brasa` | El bordo de SiezaGym    |

En desarrollo aparece un selector abajo a la derecha y la elección queda en
`localStorage`. Para mostrarlo también en producción, poné `SHOW_THEME_SWITCHER`
en `true` en `components/design2/themes.js`. Para fijar un tema y sacar el
selector del medio, cambiá `DEFAULT_THEME`.

### Agregar un tema

1. Copiá un bloque `.d2[data-d2-theme="..."]` en `app/design2.css` y cambiá las
   variables que quieras.
2. Sumá una línea a `THEMES` en `components/design2/themes.js`.

Los tests fallan si un tema del registro no tiene su bloque CSS.

## Las variables

**Forma** — `--d2-radius`, `--d2-radius-lg`, `--d2-radius-sm`.

**Vidrio** — `--d2-glass-tint` (la tinta, en `r, g, b`), `--d2-glass-1/2/3` (las
tres opacidades), `--d2-glass-filter` y `--d2-glass-filter-strong`.

El filtro va entero en una variable y **nunca** como `blur(var(--x))`: Lightning
CSS, el compilador de Tailwind v4, no sabe parsear una `var()` adentro de
`blur()` y descarta la declaración completa sin avisar. El vidrio se queda sin
esmerilar y no hay ningún error. Hay un test que lo prohíbe.

**Canto** — `--d2-edge-top`, `--d2-edge-bottom`, `--d2-border`,
`--d2-border-strong`, `--d2-shadow`, `--d2-shadow-strong`. La luz arriba y la
sombra abajo son lo que le da volumen al cristal; sin eso queda un rectángulo
translúcido.

**Texto** — `--d2-text`, `--d2-text-2`, `--d2-text-3`.

**Sólido** — `--d2-ink` y `--d2-on-ink`. Es el par del FAB y de la pastilla
activa de la barra. **Se invierte entre temas claros y oscuros**: un botón negro
sobre fondo negro desaparece, así que en `noche` el sólido es claro con el icono
oscuro. Hay un test que exige que los temas oscuros lo redefinan.

**Anillos** — `--d2-ring-track`, `--d2-ring-fill`, `--d2-ring-core`,
`--d2-ring-core-border`.

**Fondo** — `--d2-bg-a/b/c` (las tres manchas radiales), `--d2-bg-grad` (el
degradado de base), `--d2-blob-1/2/3` y `--d2-blob-filter`.

Las manchas no son decoración: el vidrio difumina lo que tiene detrás y sobre un
color plano el `backdrop-filter` no se percibe. Si sacás las manchas, el efecto
desaparece.

**Textura** — `--d2-noise-opacity` y `--d2-noise-blend`. El grano es un SVG
`feTurbulence` embebido, sin archivo. Rompe las bandas del degradado, que en los
temas oscuros se ven bastante. Con `0` se apaga.

## Los datos de la Home

Ningún número está escrito a mano, que es lo que hizo fallar al diseño anterior:

- "Meta semanal" es el porcentaje real de la meta de calorías del perfil.
- El titular dice el nombre de la rutina que toca; sin rutinas invita a crear la
  primera en vez de mostrar una inventada.
- Los cuatro anillos son volumen de la semana contra tu mejor semana, días
  entrenados sobre 7, calorías sobre la meta y series completadas.
- La tarjeta de calorías avisa cuando estimó con los 75 kg por defecto, porque
  es una estimación por MET y no una medición.

Los agregados por semana están en `lib/home/weekly.js` como funciones puras, con
tests. La semana arranca el lunes y se ancla al mediodía para que el runtime del
server, que corre en UTC, no corra el día.
