# Eval: controles del entrenamiento en curso

## Resultado medible

Se puede entrenar sin tocar la pantalla entre series: el descanso arranca solo
al marcar una, avisa cuando termina, y la serie se puede marcar desde la
actividad en vivo sin desbloquear el teléfono.

## Descanso

- Marcar una serie arranca el descanso en 1:30 y suena el confirm.
- El reloj baja de a un segundo y al llegar a cero suena el aviso **una sola
  vez**.
- `+30s` y `−15s` ajustan sobre lo que queda.
- **`−15s` con menos de 15 segundos no apaga el descanso.** Queda en 1: el
  descanso se termina cuando lo saltás, no por restar.
- `Saltar` lo apaga y la tarjeta desaparece.
- Con el descanso apagado, los botones no hacen nada y el reloj no corre.

## Terminar serie desde la actividad en vivo

- El botón de la Dynamic Island marca **la primera serie sin marcar**,
  recorriendo los ejercicios en orden. Es la misma regla con la que la isla
  elige qué ejercicio mostrar, así que el botón y el texto nunca apuntan a
  series distintas.
- Una serie salteada en el medio se llena antes que las de después.
- Con todas las series marcadas el botón no marca de más ni arranca otro
  descanso.
- Una rutina sin ejercicios no lo rompe.

## Ejercicios plegados

- Al entrar, **solo está desplegado el ejercicio que estás haciendo**; el resto
  va plegado. Una rutina de ocho ejercicios con todo abierto no entra en un
  teléfono.
- Plegado se ve el nombre, la insignia de GIF/Video, el contador `0/3` y el
  chevron.
- Tocar el encabezado despliega y vuelve a plegar cualquiera, incluso uno ya
  terminado.
- Tocar la insignia de GIF **no** despliega: abre la media.
- Al terminar todas las series de un ejercicio, se pliega solo y se despliega el
  siguiente.

## Ejercicio terminado

- Queda en verde: borde, barra izquierda y el contador `✓ 3/3` en una pastilla
  verde sólida.
- **El nombre NO se pinta de verde.** Sobre el vidrio claro del tema Plata no se
  leía; el estado lo dicen las otras tres señales.
- El contador hace un pulso corto al completarse, una sola vez.
- Un ejercicio al que le sacaste todas las series queda en 0 de 0 y **no** se
  pinta de verde.
- Una serie fallada cuenta como hecha: cargaste el peso y no llegaste.

## Vibración

- Marcar una serie vibra (impacto medio).
- Terminar **todas** las series de un ejercicio vibra distinto (éxito), para que
  se note sin mirar.
- También vibra al marcar desde el botón de la Dynamic Island, donde no hay
  botón en pantalla que lo dispare.
- Si no se siente, revisá Ajustes › Sonidos y vibraciones › Vibración del
  sistema: la app no puede forzarla.

## Lo que no es un bug

**El descanso arranca en 90s y la estimación de duración usa 75s.** Son dos
números distintos a propósito: los 75 son los de `lib/routines/summary.js` y
sirven para que la app y la web digan el mismo "17 min estimados". Los 90 son el
descanso que la app propone. Hay un test que fija los dos para que nadie
"arregle" uno contra el otro.

## Gate

`xcodebuild test -project ios/SiezaGym.xcodeproj -scheme SiezaGym -destination 'platform=iOS Simulator,name=iPhone 17 Pro'`
