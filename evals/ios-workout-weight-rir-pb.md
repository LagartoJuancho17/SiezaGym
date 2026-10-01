# Eval: pesos repetidos, RIR 1 y nuevo PB en iPhone

## Resultado medible

Al repetir una rutina, el alumno encuentra cargados los kilos de su última
sesión sin reescribirlos; una mejora de carga completada se reconoce en la
pantalla. Umbral: todos los escenarios siguientes deben pasar.

## Escenarios

1. Crear una rutina de dos series de press **sin peso**. Entrenar con 60 y
   65 kg, marcar ambas series y guardar. Abrir la misma rutina: aparecen 60 y
   65 kg, pero ninguna serie está marcada.
2. Si el plan decía 50 kg y la sesión terminó con 55 kg, la próxima sesión
   muestra 55 kg. Volver al editor del plan: sigue diciendo 50 kg.
3. Una serie fallada con 80 kg no precarga 80 kg al repetir. Una rutina
   distinta con el mismo ejercicio tampoco altera la precarga.
4. Con historial de 60 kg, escribir 62,5 kg **sin marcar** la serie no muestra
   PB. Al marcarla aparece «NUEVO PB» con 62,5 kg, trofeo y borde Brasa.
   Al plegar la tarjeta, la indicación sigue visible. Marcarla fallada lo
   elimina. La primera carga de un ejercicio sin historial no anuncia PB.
5. Con un registro previo de 100 kg × 8 reps y RIR 3, abrir un plan de 8
   reps: muestra «RIR 1 estimado: ~105 kg». Sin RIR registrado, no aparece
   estimación. Al completar una serie y anotar su RIR, la referencia cambia
   durante la sesión. No muestra estimación en ejercicios de tiempo.
6. El nuevo peso se conserva tras cerrar y volver a abrir la app, porque la
   fuente es la sesión guardada en Firestore, no memoria local.

## Gate automático

`xcodebuild test -project ios/SiezaGym.xcodeproj -scheme SiezaGym -destination 'platform=iOS Simulator,name=iPhone 17' -only-testing:SiezaGymTests/WorkoutWeightTests`

El pase visual en iPhone verifica que la nueva entrada RIR, los botones de
peso y las repeticiones queden en una segunda línea sin cortar «kg»; los
controles de completar van arriba y no se solapan. Revisar también con texto
grande y VoiceOver. La estimación nunca sustituye el
criterio del usuario para elegir una carga segura.
