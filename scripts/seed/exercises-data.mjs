// Catalogo semilla de ejercicios. Autoria propia (no viene de ningun dataset externo:
// el unico dataset con gifs que evaluamos tiene la media con licencia de terceros -
// Gym visual - que no podemos redistribuir; el texto lo escribimos directo en nuestro
// formato de 16 grupos musculares en vez de adaptar el de otro dataset).
//
// muscleWeights: claves de MUSCLE_GROUPS, los valores de cada ejercicio suman 1.0.
// El musculo primario es la clave con mayor peso (validado en seedExercises.mjs).

export {
  MUSCLE_GROUPS,
  EQUIPMENT,
  PATTERNS,
  REGISTRATION_TYPES,
} from "../../lib/exercises/constants.js";

export const EXERCISES = [
  // ---- PECHO ----
  {
    nameEs: "Press de banca con barra",
    nameEn: "Barbell bench press",
    equipment: "barra",
    pattern: "empuje_horizontal",
    muscleWeights: { pecho: 0.6, triceps: 0.25, deltoideAnterior: 0.15 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "Acostado en el banco, bajá la barra al pecho de forma controlada y empujá hasta extender los brazos. Omóplatos retraídos y pies firmes en el piso.",
    descriptionEn:
      "Lying on the bench, lower the bar to your chest under control and press up to full extension. Keep shoulder blades retracted and feet planted.",
  },
  {
    nameEs: "Press inclinado con barra",
    nameEn: "Barbell incline bench press",
    equipment: "barra",
    pattern: "empuje_horizontal",
    muscleWeights: { pecho: 0.55, deltoideAnterior: 0.25, triceps: 0.2 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "Banco a 30-45 grados. Bajá la barra a la parte superior del pecho y empujá en línea recta hacia arriba, sin rebotar.",
    descriptionEn:
      "Bench set at 30-45 degrees. Lower the bar to your upper chest and press straight up without bouncing.",
  },
  {
    nameEs: "Press de banca con mancuernas",
    nameEn: "Dumbbell bench press",
    equipment: "mancuerna",
    pattern: "empuje_horizontal",
    muscleWeights: { pecho: 0.6, triceps: 0.22, deltoideAnterior: 0.18 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "Acostado en el banco con una mancuerna en cada mano, bajá controlado a los lados del pecho y empujá hasta juntar arriba sin chocar.",
    descriptionEn:
      "Lying on the bench with a dumbbell in each hand, lower under control to chest level and press up until arms are extended.",
  },
  {
    nameEs: "Press inclinado con mancuernas",
    nameEn: "Dumbbell incline bench press",
    equipment: "mancuerna",
    pattern: "empuje_horizontal",
    muscleWeights: { pecho: 0.55, deltoideAnterior: 0.28, triceps: 0.17 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "Banco inclinado. Empujá las mancuernas hacia arriba y ligeramente hacia adentro, controlando la bajada hasta sentir el estiramiento del pecho.",
    descriptionEn:
      "Incline bench. Press the dumbbells up and slightly inward, controlling the descent until you feel a stretch across the chest.",
  },
  {
    nameEs: "Aperturas con mancuernas",
    nameEn: "Dumbbell fly",
    equipment: "mancuerna",
    pattern: "aislamiento",
    muscleWeights: { pecho: 0.85, deltoideAnterior: 0.15 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "Acostado en el banco, brazos semi-flexionados, abrí los brazos en arco hasta sentir el estiramiento y volvé cerrando arriba sin juntar los codos.",
    descriptionEn:
      "Lying on the bench with a slight elbow bend, open your arms in an arc until you feel a stretch, then bring them back together.",
  },
  {
    nameEs: "Cruce de poleas",
    nameEn: "Cable crossover",
    equipment: "polea",
    pattern: "aislamiento",
    muscleWeights: { pecho: 0.85, deltoideAnterior: 0.15 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "De pie entre las poleas altas, llevá las manos hacia adelante y abajo cruzando al frente del cuerpo, apretando el pecho al final.",
    descriptionEn:
      "Standing between the high pulleys, bring your hands forward and down, crossing in front of your body and squeezing your chest.",
  },
  {
    nameEs: "Press de pecho en máquina",
    nameEn: "Machine chest press",
    equipment: "maquina",
    pattern: "empuje_horizontal",
    muscleWeights: { pecho: 0.65, triceps: 0.2, deltoideAnterior: 0.15 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "Sentado con la espalda apoyada, empujá las manijas hacia adelante hasta casi extender los brazos y volvé controlado.",
    descriptionEn:
      "Seated with your back supported, press the handles forward until arms are nearly extended, then return under control.",
  },
  {
    nameEs: "Flexiones de brazos",
    nameEn: "Push-up",
    equipment: "peso_corporal",
    pattern: "empuje_horizontal",
    muscleWeights: { pecho: 0.55, triceps: 0.25, deltoideAnterior: 0.2 },
    registrationType: "reps",
    unilateral: false,
    descriptionEs:
      "Cuerpo en línea recta, manos un poco más anchas que los hombros. Bajá hasta rozar el piso con el pecho y empujá hasta extender los brazos.",
    descriptionEn:
      "Body in a straight line, hands slightly wider than shoulders. Lower until your chest nearly touches the floor, then push back up.",
  },
  {
    nameEs: "Fondos en paralelas",
    nameEn: "Chest dip",
    equipment: "peso_corporal",
    pattern: "empuje_horizontal",
    muscleWeights: { pecho: 0.5, triceps: 0.3, deltoideAnterior: 0.2 },
    registrationType: "reps",
    unilateral: false,
    descriptionEs:
      "Cuerpo inclinado hacia adelante, bajá flexionando los codos hasta 90 grados y empujá hasta extender los brazos sin bloquear de golpe.",
    descriptionEn:
      "Lean your torso forward, lower by bending your elbows to about 90 degrees, then push back up to full extension.",
  },

  // ---- DORSAL ----
  {
    nameEs: "Remo con barra",
    nameEn: "Barbell bent-over row",
    equipment: "barra",
    pattern: "traccion_horizontal",
    muscleWeights: { dorsal: 0.55, espaldaAltaTrapecio: 0.25, biceps: 0.2 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "Torso inclinado casi paralelo al piso, espalda neutra. Tirá la barra hacia el abdomen apretando los omóplatos y bajá controlado.",
    descriptionEn:
      "Torso nearly parallel to the floor, neutral spine. Pull the bar to your abdomen squeezing your shoulder blades, then lower under control.",
  },
  {
    nameEs: "Remo con mancuerna a una mano",
    nameEn: "Dumbbell one-arm row",
    equipment: "mancuerna",
    pattern: "traccion_horizontal",
    muscleWeights: { dorsal: 0.55, espaldaAltaTrapecio: 0.25, biceps: 0.2 },
    registrationType: "peso_reps",
    unilateral: true,
    descriptionEs:
      "Apoyado con una mano y rodilla en el banco, tirá la mancuerna hacia la cadera manteniendo el torso quieto.",
    descriptionEn:
      "Supported by one hand and knee on the bench, pull the dumbbell toward your hip while keeping your torso still.",
  },
  {
    nameEs: "Jalón al pecho en polea",
    nameEn: "Cable lat pulldown",
    equipment: "polea",
    pattern: "traccion_vertical",
    muscleWeights: { dorsal: 0.6, biceps: 0.25, espaldaAltaTrapecio: 0.15 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "Sentado con las piernas fijas, tirá la barra hacia la parte alta del pecho llevando los codos hacia abajo y atrás.",
    descriptionEn:
      "Seated with legs locked in, pull the bar down to your upper chest by driving your elbows down and back.",
  },
  {
    nameEs: "Remo sentado en polea",
    nameEn: "Cable seated row",
    equipment: "polea",
    pattern: "traccion_horizontal",
    muscleWeights: { dorsal: 0.5, espaldaAltaTrapecio: 0.3, biceps: 0.2 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "Sentado con las rodillas semi-flexionadas, tirá la manija hacia el abdomen manteniendo la espalda recta, sin balancear el torso.",
    descriptionEn:
      "Seated with knees slightly bent, pull the handle to your abdomen while keeping your back straight, without rocking your torso.",
  },
  {
    nameEs: "Remo en máquina",
    nameEn: "Machine row",
    equipment: "maquina",
    pattern: "traccion_horizontal",
    muscleWeights: { dorsal: 0.55, espaldaAltaTrapecio: 0.25, biceps: 0.2 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "Pecho apoyado en el respaldo, tirá las manijas hacia atrás apretando los omóplatos y volvé controlado.",
    descriptionEn:
      "Chest supported against the pad, pull the handles back while squeezing your shoulder blades, then return under control.",
  },
  {
    nameEs: "Dominadas",
    nameEn: "Pull-up",
    equipment: "peso_corporal",
    pattern: "traccion_vertical",
    muscleWeights: { dorsal: 0.6, biceps: 0.25, espaldaAltaTrapecio: 0.15 },
    registrationType: "reps",
    unilateral: false,
    descriptionEs:
      "Colgado de la barra con agarre prono, tirá hasta que el mentón supere la barra y bajá controlado hasta extender los brazos.",
    descriptionEn:
      "Hanging from the bar with an overhand grip, pull up until your chin clears the bar, then lower under control to full extension.",
  },

  // ---- ESPALDA ALTA Y TRAPECIO ----
  {
    nameEs: "Encogimientos con barra",
    nameEn: "Barbell shrug",
    equipment: "barra",
    pattern: "aislamiento",
    muscleWeights: { espaldaAltaTrapecio: 0.9, antebrazo: 0.1 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "De pie con la barra al frente, elevá los hombros directo hacia arriba sin rodar, sostené un segundo arriba y bajá controlado.",
    descriptionEn:
      "Standing with the bar in front, shrug your shoulders straight up without rolling them, pause, then lower under control.",
  },
  {
    nameEs: "Encogimientos con mancuernas",
    nameEn: "Dumbbell shrug",
    equipment: "mancuerna",
    pattern: "aislamiento",
    muscleWeights: { espaldaAltaTrapecio: 0.9, antebrazo: 0.1 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "De pie con una mancuerna en cada mano, elevá los hombros directo hacia arriba y bajá controlado.",
    descriptionEn:
      "Standing with a dumbbell in each hand, shrug your shoulders straight up, then lower under control.",
  },
  {
    nameEs: "Face pull en polea",
    nameEn: "Cable face pull",
    equipment: "polea",
    pattern: "traccion_horizontal",
    muscleWeights: { espaldaAltaTrapecio: 0.45, deltoidePosterior: 0.4, dorsal: 0.15 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "Polea a la altura de la cara, tirá la cuerda hacia la cara separando las manos, llevando los codos hacia atrás y arriba.",
    descriptionEn:
      "Cable at face height, pull the rope toward your face while separating your hands, driving your elbows back and up.",
  },
  {
    nameEs: "Encogimientos en máquina",
    nameEn: "Machine shrug",
    equipment: "maquina",
    pattern: "aislamiento",
    muscleWeights: { espaldaAltaTrapecio: 0.9, antebrazo: 0.1 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "Sentado o de pie en la máquina, elevá los hombros contra la resistencia y bajá controlado.",
    descriptionEn:
      "Seated or standing at the machine, shrug your shoulders against the resistance, then lower under control.",
  },
  {
    nameEs: "Remo invertido",
    nameEn: "Bodyweight inverted row",
    equipment: "peso_corporal",
    pattern: "traccion_horizontal",
    muscleWeights: { espaldaAltaTrapecio: 0.45, dorsal: 0.35, biceps: 0.2 },
    registrationType: "reps",
    unilateral: false,
    descriptionEs:
      "Colgado bajo una barra fija con el cuerpo recto, tirá el pecho hacia la barra apretando los omóplatos y bajá controlado.",
    descriptionEn:
      "Hanging under a fixed bar with your body straight, pull your chest toward the bar squeezing your shoulder blades, then lower under control.",
  },

  // ---- DELTOIDE ANTERIOR ----
  {
    nameEs: "Press militar con barra",
    nameEn: "Barbell overhead press",
    equipment: "barra",
    pattern: "empuje_vertical",
    muscleWeights: { deltoideAnterior: 0.55, triceps: 0.25, pecho: 0.2 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "De pie, barra a la altura de los hombros. Empujá hacia arriba en línea recta hasta extender los brazos, sin arquear la espalda baja.",
    descriptionEn:
      "Standing with the bar at shoulder height, press straight overhead to full extension without arching your lower back.",
  },
  {
    nameEs: "Press de hombros con mancuernas",
    nameEn: "Dumbbell shoulder press",
    equipment: "mancuerna",
    pattern: "empuje_vertical",
    muscleWeights: { deltoideAnterior: 0.55, triceps: 0.25, deltoideLateral: 0.2 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "Sentado o de pie, empujá las mancuernas hacia arriba hasta casi juntarlas sobre la cabeza y bajá controlado a la altura de los hombros.",
    descriptionEn:
      "Seated or standing, press the dumbbells up until they nearly meet overhead, then lower under control to shoulder height.",
  },
  {
    nameEs: "Press de hombros en máquina",
    nameEn: "Machine shoulder press",
    equipment: "maquina",
    pattern: "empuje_vertical",
    muscleWeights: { deltoideAnterior: 0.55, triceps: 0.25, deltoideLateral: 0.2 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "Sentado con la espalda apoyada, empujá las manijas hacia arriba y bajá controlado sin bloquear los codos de golpe.",
    descriptionEn:
      "Seated with your back supported, press the handles up, then lower under control without locking your elbows abruptly.",
  },
  {
    nameEs: "Flexiones pike",
    nameEn: "Pike push-up",
    equipment: "peso_corporal",
    pattern: "empuje_vertical",
    muscleWeights: { deltoideAnterior: 0.5, triceps: 0.3, pecho: 0.2 },
    registrationType: "reps",
    unilateral: false,
    descriptionEs:
      "Cadera elevada formando una V invertida, bajá la cabeza hacia el piso flexionando los codos y empujá de vuelta arriba.",
    descriptionEn:
      "Hips raised in an inverted V, lower your head toward the floor by bending your elbows, then push back up.",
  },

  // ---- DELTOIDE LATERAL ----
  {
    nameEs: "Elevaciones laterales con mancuerna",
    nameEn: "Dumbbell lateral raise",
    equipment: "mancuerna",
    pattern: "aislamiento",
    muscleWeights: { deltoideLateral: 0.85, espaldaAltaTrapecio: 0.15 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "De pie con una leve flexión de codos, elevá los brazos hacia los costados hasta la altura de los hombros y bajá controlado.",
    descriptionEn:
      "Standing with a slight elbow bend, raise your arms out to the sides to shoulder height, then lower under control.",
  },
  {
    nameEs: "Elevaciones laterales en polea",
    nameEn: "Cable lateral raise",
    equipment: "polea",
    pattern: "aislamiento",
    muscleWeights: { deltoideLateral: 0.85, espaldaAltaTrapecio: 0.15 },
    registrationType: "peso_reps",
    unilateral: true,
    descriptionEs:
      "De costado a la polea baja, elevá el brazo hacia el lado hasta la altura del hombro manteniendo tensión constante.",
    descriptionEn:
      "Standing sideways to the low pulley, raise your arm out to shoulder height keeping constant tension on the cable.",
  },
  {
    nameEs: "Elevaciones laterales en máquina",
    nameEn: "Machine lateral raise",
    equipment: "maquina",
    pattern: "aislamiento",
    muscleWeights: { deltoideLateral: 0.85, espaldaAltaTrapecio: 0.15 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "Sentado con los codos apoyados en las almohadillas, elevá los brazos hacia los costados hasta la altura de los hombros.",
    descriptionEn:
      "Seated with your elbows on the pads, raise your arms out to the sides up to shoulder height.",
  },

  // ---- DELTOIDE POSTERIOR ----
  {
    nameEs: "Aperturas posteriores con mancuerna",
    nameEn: "Dumbbell rear delt fly",
    equipment: "mancuerna",
    pattern: "aislamiento",
    muscleWeights: { deltoidePosterior: 0.75, espaldaAltaTrapecio: 0.25 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "Torso inclinado hacia adelante, abrí los brazos hacia los costados apretando entre los omóplatos y bajá controlado.",
    descriptionEn:
      "Hinge forward at the hips, raise your arms out to the sides squeezing your shoulder blades together, then lower under control.",
  },
  {
    nameEs: "Aperturas posteriores en polea",
    nameEn: "Cable rear delt fly",
    equipment: "polea",
    pattern: "aislamiento",
    muscleWeights: { deltoidePosterior: 0.75, espaldaAltaTrapecio: 0.25 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "Con las poleas cruzadas a la altura del pecho, abrí los brazos hacia los costados y atrás sin balancear el torso.",
    descriptionEn:
      "With the cables crossed at chest height, open your arms out and back to the sides without swinging your torso.",
  },
  {
    nameEs: "Contractora inversa",
    nameEn: "Machine reverse fly",
    equipment: "maquina",
    pattern: "aislamiento",
    muscleWeights: { deltoidePosterior: 0.75, espaldaAltaTrapecio: 0.25 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "Pecho apoyado en el respaldo, abrí los brazos hacia atrás apretando entre los omóplatos y volvé controlado.",
    descriptionEn:
      "Chest against the pad, open your arms back while squeezing your shoulder blades together, then return under control.",
  },
  {
    nameEs: "Elevación Y en prono",
    nameEn: "Prone Y-raise",
    equipment: "peso_corporal",
    pattern: "aislamiento",
    muscleWeights: { deltoidePosterior: 0.7, espaldaAltaTrapecio: 0.3 },
    registrationType: "reps",
    unilateral: false,
    descriptionEs:
      "Acostado boca abajo, elevá los brazos hacia adelante formando una Y, apretando entre los omóplatos, y bajá controlado.",
    descriptionEn:
      "Lying face down, raise your arms forward into a Y shape, squeezing your shoulder blades, then lower under control.",
  },

  // ---- BICEPS ----
  {
    nameEs: "Curl con barra",
    nameEn: "Barbell curl",
    equipment: "barra",
    pattern: "aislamiento",
    muscleWeights: { biceps: 0.9, antebrazo: 0.1 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "De pie, codos pegados al torso. Flexioná los brazos llevando la barra hacia los hombros y bajá controlado sin balancear.",
    descriptionEn:
      "Standing with elbows close to your torso, curl the bar up toward your shoulders, then lower under control without swinging.",
  },
  {
    nameEs: "Curl con mancuerna",
    nameEn: "Dumbbell curl",
    equipment: "mancuerna",
    pattern: "aislamiento",
    muscleWeights: { biceps: 0.9, antebrazo: 0.1 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "De pie o sentado, flexioná el codo llevando la mancuerna hacia el hombro y bajá controlado.",
    descriptionEn:
      "Standing or seated, curl the dumbbell up toward your shoulder, then lower under control.",
  },
  {
    nameEs: "Curl martillo con mancuerna",
    nameEn: "Dumbbell hammer curl",
    equipment: "mancuerna",
    pattern: "aislamiento",
    muscleWeights: { biceps: 0.65, antebrazo: 0.35 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "Igual que el curl normal pero con agarre neutro (palmas enfrentadas), sin girar la muñeca durante el movimiento.",
    descriptionEn:
      "Same as a regular curl but with a neutral grip (palms facing each other), keeping your wrist from rotating.",
  },
  {
    nameEs: "Curl en polea",
    nameEn: "Cable curl",
    equipment: "polea",
    pattern: "aislamiento",
    muscleWeights: { biceps: 0.9, antebrazo: 0.1 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "De pie frente a la polea baja, flexioná los codos llevando la barra hacia arriba manteniendo tensión constante.",
    descriptionEn:
      "Standing in front of the low pulley, curl the bar up while keeping constant tension on the cable.",
  },
  {
    nameEs: "Curl en máquina",
    nameEn: "Machine curl",
    equipment: "maquina",
    pattern: "aislamiento",
    muscleWeights: { biceps: 0.9, antebrazo: 0.1 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "Brazos apoyados sobre la almohadilla, flexioná los codos llevando la manija hacia los hombros.",
    descriptionEn:
      "Arms resting on the pad, curl the handle up toward your shoulders.",
  },
  {
    nameEs: "Curl predicador",
    nameEn: "Preacher curl",
    equipment: "barra",
    pattern: "aislamiento",
    muscleWeights: { biceps: 0.9, antebrazo: 0.1 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "Brazos apoyados sobre el banco predicador, flexioná los codos sin despegar los brazos de la almohadilla.",
    descriptionEn:
      "Arms resting on the preacher bench pad, curl up without letting your arms lift off the pad.",
  },
  {
    nameEs: "Dominadas supinas",
    nameEn: "Chin-up",
    equipment: "peso_corporal",
    pattern: "traccion_vertical",
    muscleWeights: { biceps: 0.45, dorsal: 0.4, espaldaAltaTrapecio: 0.15 },
    registrationType: "reps",
    unilateral: false,
    descriptionEs:
      "Colgado de la barra con agarre supino (palmas hacia vos), tirá hasta que el mentón supere la barra y bajá controlado.",
    descriptionEn:
      "Hanging from the bar with an underhand grip (palms facing you), pull up until your chin clears the bar, then lower under control.",
  },

  // ---- TRICEPS ----
  {
    nameEs: "Press francés con barra",
    nameEn: "Barbell lying triceps extension",
    equipment: "barra",
    pattern: "aislamiento",
    muscleWeights: { triceps: 0.9, deltoidePosterior: 0.1 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "Acostado en el banco, bajá la barra controlada hacia la frente flexionando solo los codos y extendé de vuelta.",
    descriptionEn:
      "Lying on the bench, lower the bar toward your forehead bending only your elbows, then extend back up.",
  },
  {
    nameEs: "Press cerrado con barra",
    nameEn: "Close-grip barbell bench press",
    equipment: "barra",
    pattern: "empuje_horizontal",
    muscleWeights: { triceps: 0.5, pecho: 0.35, deltoideAnterior: 0.15 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "Igual al press de banca pero con agarre a la altura de los hombros, codos pegados al torso durante el descenso.",
    descriptionEn:
      "Same as the bench press but with a shoulder-width grip, keeping your elbows close to your torso on the way down.",
  },
  {
    nameEs: "Extensión de tríceps con mancuerna",
    nameEn: "Dumbbell triceps extension",
    equipment: "mancuerna",
    pattern: "aislamiento",
    muscleWeights: { triceps: 0.9, deltoidePosterior: 0.1 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "De pie o sentado, mancuerna detrás de la cabeza, extendé el codo hacia arriba sin mover el brazo del hombro.",
    descriptionEn:
      "Standing or seated, dumbbell behind your head, extend your elbow upward without moving your upper arm.",
  },
  {
    nameEs: "Extensión de tríceps en polea",
    nameEn: "Cable triceps pushdown",
    equipment: "polea",
    pattern: "aislamiento",
    muscleWeights: { triceps: 0.95, antebrazo: 0.05 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "Codos pegados al torso, empujá la barra o cuerda hacia abajo hasta extender los brazos y volvé controlado.",
    descriptionEn:
      "Elbows close to your torso, push the bar or rope down to full extension, then return under control.",
  },
  {
    nameEs: "Extensión de tríceps en máquina",
    nameEn: "Machine triceps extension",
    equipment: "maquina",
    pattern: "aislamiento",
    muscleWeights: { triceps: 0.9, deltoidePosterior: 0.1 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "Sentado con los codos apoyados, extendé los antebrazos hacia abajo o adelante según la máquina y volvé controlado.",
    descriptionEn:
      "Seated with your elbows supported, extend your forearms down or forward depending on the machine, then return under control.",
  },
  {
    nameEs: "Fondos en banco",
    nameEn: "Bench dip",
    equipment: "peso_corporal",
    pattern: "aislamiento",
    muscleWeights: { triceps: 0.75, deltoideAnterior: 0.15, pecho: 0.1 },
    registrationType: "reps",
    unilateral: false,
    descriptionEs:
      "Manos apoyadas en el borde del banco, bajá el cuerpo flexionando los codos hacia atrás y empujá de vuelta arriba.",
    descriptionEn:
      "Hands on the edge of the bench, lower your body by bending your elbows straight back, then push back up.",
  },

  // ---- ANTEBRAZO ----
  {
    nameEs: "Curl de muñeca con barra",
    nameEn: "Barbell wrist curl",
    equipment: "barra",
    pattern: "aislamiento",
    muscleWeights: { antebrazo: 1.0 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "Antebrazos apoyados en el muslo o banco, flexioná solo la muñeca subiendo la barra y bajá controlado.",
    descriptionEn:
      "Forearms resting on your thighs or a bench, curl only your wrists up, then lower under control.",
  },
  {
    nameEs: "Curl de muñeca en polea",
    nameEn: "Cable wrist curl",
    equipment: "polea",
    pattern: "aislamiento",
    muscleWeights: { antebrazo: 1.0 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "Antebrazo apoyado frente a la polea baja, flexioná solo la muñeca subiendo la barra y bajá controlado.",
    descriptionEn:
      "Forearm resting in front of the low pulley, curl only your wrist up, then lower under control.",
  },
  {
    nameEs: "Curl de muñeca con mancuerna",
    nameEn: "Dumbbell wrist curl",
    equipment: "mancuerna",
    pattern: "aislamiento",
    muscleWeights: { antebrazo: 1.0 },
    registrationType: "peso_reps",
    unilateral: true,
    descriptionEs:
      "Antebrazo apoyado, flexioná la muñeca subiendo la mancuerna y bajá controlado hasta el estiramiento completo.",
    descriptionEn:
      "Forearm resting on a support, curl your wrist up, then lower under control to a full stretch.",
  },
  {
    nameEs: "Curl de muñeca inverso con mancuerna",
    nameEn: "Dumbbell reverse wrist curl",
    equipment: "mancuerna",
    pattern: "aislamiento",
    muscleWeights: { antebrazo: 1.0 },
    registrationType: "peso_reps",
    unilateral: true,
    descriptionEs:
      "Igual al curl de muñeca pero con la palma hacia abajo, trabajando el lado opuesto del antebrazo.",
    descriptionEn:
      "Same as the wrist curl but with palm facing down, working the opposite side of the forearm.",
  },
  {
    nameEs: "Dead hang",
    nameEn: "Dead hang",
    equipment: "peso_corporal",
    pattern: "aislamiento",
    muscleWeights: { antebrazo: 0.7, dorsal: 0.3 },
    registrationType: "tiempo",
    unilateral: false,
    descriptionEs:
      "Colgado de una barra fija con los brazos extendidos, sostené la posición el mayor tiempo posible sin balancear.",
    descriptionEn:
      "Hang from a fixed bar with arms fully extended, holding the position as long as possible without swinging.",
  },

  // ---- CUADRICEPS ----
  {
    nameEs: "Sentadilla con barra",
    nameEn: "Barbell back squat",
    equipment: "barra",
    pattern: "dominante_rodilla",
    muscleWeights: { cuadriceps: 0.55, gluteo: 0.3, isquiotibiales: 0.15 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "Barra apoyada en la espalda alta, bajá flexionando cadera y rodillas hasta paralelo o más, y subí empujando el piso con los talones.",
    descriptionEn:
      "Bar resting on your upper back, squat down by bending hips and knees to parallel or below, then drive up through your heels.",
  },
  {
    nameEs: "Zancadas con barra",
    nameEn: "Barbell lunge",
    equipment: "barra",
    pattern: "dominante_rodilla",
    muscleWeights: { cuadriceps: 0.5, gluteo: 0.35, isquiotibiales: 0.15 },
    registrationType: "peso_reps",
    unilateral: true,
    descriptionEs:
      "Con la barra en la espalda, dá un paso adelante y bajá hasta que ambas rodillas formen 90 grados, volviendo a la posición inicial.",
    descriptionEn:
      "With the bar on your back, step forward and lower until both knees reach about 90 degrees, then return to start.",
  },
  {
    nameEs: "Sentadilla goblet con mancuerna",
    nameEn: "Dumbbell goblet squat",
    equipment: "mancuerna",
    pattern: "dominante_rodilla",
    muscleWeights: { cuadriceps: 0.55, gluteo: 0.3, isquiotibiales: 0.15 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "Mancuerna sostenida contra el pecho, bajá en sentadilla manteniendo el torso erguido y los codos entre las rodillas.",
    descriptionEn:
      "Hold a dumbbell against your chest, squat down keeping your torso upright and elbows between your knees.",
  },
  {
    nameEs: "Zancadas con mancuernas",
    nameEn: "Dumbbell lunge",
    equipment: "mancuerna",
    pattern: "dominante_rodilla",
    muscleWeights: { cuadriceps: 0.5, gluteo: 0.35, isquiotibiales: 0.15 },
    registrationType: "peso_reps",
    unilateral: true,
    descriptionEs:
      "Mancuernas a los costados, dá un paso adelante y bajá hasta 90 grados en ambas rodillas, volviendo al centro.",
    descriptionEn:
      "Dumbbells at your sides, step forward and lower until both knees reach about 90 degrees, then return to center.",
  },
  {
    nameEs: "Prensa de piernas",
    nameEn: "Machine leg press",
    equipment: "maquina",
    pattern: "dominante_rodilla",
    muscleWeights: { cuadriceps: 0.55, gluteo: 0.3, isquiotibiales: 0.15 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "Sentado en la máquina, bajá la plataforma flexionando las rodillas hasta 90 grados y empujá sin bloquear de golpe.",
    descriptionEn:
      "Seated at the machine, lower the platform by bending your knees to about 90 degrees, then press without locking out abruptly.",
  },
  {
    nameEs: "Extensión de cuádriceps en máquina",
    nameEn: "Machine leg extension",
    equipment: "maquina",
    pattern: "aislamiento",
    muscleWeights: { cuadriceps: 1.0 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "Sentado con los tobillos bajo la almohadilla, extendé las rodillas hasta casi trabar y bajá controlado.",
    descriptionEn:
      "Seated with your ankles under the pad, extend your knees until nearly locked out, then lower under control.",
  },
  {
    nameEs: "Sentadilla con peso corporal",
    nameEn: "Bodyweight squat",
    equipment: "peso_corporal",
    pattern: "dominante_rodilla",
    muscleWeights: { cuadriceps: 0.55, gluteo: 0.3, isquiotibiales: 0.15 },
    registrationType: "reps",
    unilateral: false,
    descriptionEs:
      "Pies al ancho de hombros, bajá flexionando cadera y rodillas manteniendo el pecho arriba y subí empujando los talones.",
    descriptionEn:
      "Feet shoulder-width apart, squat down by bending hips and knees while keeping your chest up, then drive through your heels.",
  },
  {
    nameEs: "Zancadas con peso corporal",
    nameEn: "Bodyweight lunge",
    equipment: "peso_corporal",
    pattern: "dominante_rodilla",
    muscleWeights: { cuadriceps: 0.5, gluteo: 0.35, isquiotibiales: 0.15 },
    registrationType: "reps",
    unilateral: true,
    descriptionEs:
      "Dá un paso adelante y bajá hasta que ambas rodillas formen 90 grados, empujando de vuelta a la posición inicial.",
    descriptionEn:
      "Step forward and lower until both knees reach about 90 degrees, then push back to the starting position.",
  },

  // ---- ISQUIOTIBIALES ----
  {
    nameEs: "Peso muerto rumano con barra",
    nameEn: "Barbell Romanian deadlift",
    equipment: "barra",
    pattern: "dominante_cadera",
    muscleWeights: { isquiotibiales: 0.55, gluteo: 0.35, lumbar: 0.1 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "Piernas casi extendidas, empujá la cadera hacia atrás bajando la barra pegada a las piernas hasta sentir el estiramiento y volvé extendiendo la cadera.",
    descriptionEn:
      "Legs nearly straight, push your hips back lowering the bar close to your legs until you feel a stretch, then return by extending your hips.",
  },
  {
    nameEs: "Peso muerto rumano con mancuernas",
    nameEn: "Dumbbell Romanian deadlift",
    equipment: "mancuerna",
    pattern: "dominante_cadera",
    muscleWeights: { isquiotibiales: 0.55, gluteo: 0.35, lumbar: 0.1 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "Igual al peso muerto rumano con barra pero con una mancuerna en cada mano, pegadas a las piernas durante todo el recorrido.",
    descriptionEn:
      "Same as the barbell Romanian deadlift but with a dumbbell in each hand, kept close to your legs throughout.",
  },
  {
    nameEs: "Curl femoral en máquina",
    nameEn: "Machine lying leg curl",
    equipment: "maquina",
    pattern: "aislamiento",
    muscleWeights: { isquiotibiales: 1.0 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "Acostado boca abajo, flexioná las rodillas llevando el rodillo hacia los glúteos y bajá controlado.",
    descriptionEn:
      "Lying face down, curl your knees to bring the pad toward your glutes, then lower under control.",
  },
  {
    nameEs: "Peso muerto rumano a una pierna",
    nameEn: "Single-leg Romanian deadlift",
    equipment: "peso_corporal",
    pattern: "dominante_cadera",
    muscleWeights: { isquiotibiales: 0.5, gluteo: 0.35, lumbar: 0.15 },
    registrationType: "reps",
    unilateral: true,
    descriptionEs:
      "Parado en una pierna, empujá la cadera hacia atrás bajando el torso mientras la otra pierna se eleva atrás, y volvé al centro.",
    descriptionEn:
      "Standing on one leg, hinge your hips back lowering your torso as the other leg extends behind you, then return to standing.",
  },

  // ---- GLUTEO ----
  {
    nameEs: "Hip thrust con barra",
    nameEn: "Barbell hip thrust",
    equipment: "barra",
    pattern: "dominante_cadera",
    muscleWeights: { gluteo: 0.65, isquiotibiales: 0.25, cuadriceps: 0.1 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "Espalda alta apoyada en el banco, barra sobre la cadera. Empujá la cadera hacia arriba hasta extender por completo y bajá controlado.",
    descriptionEn:
      "Upper back against the bench, bar across your hips. Drive your hips up to full extension, then lower under control.",
  },
  {
    nameEs: "Hip thrust con mancuerna",
    nameEn: "Dumbbell hip thrust",
    equipment: "mancuerna",
    pattern: "dominante_cadera",
    muscleWeights: { gluteo: 0.65, isquiotibiales: 0.25, cuadriceps: 0.1 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "Espalda alta apoyada en el banco, mancuerna sobre la cadera. Empujá la cadera hacia arriba hasta extender por completo y bajá controlado.",
    descriptionEn:
      "Upper back against the bench, dumbbell across your hips. Drive your hips up to full extension, then lower under control.",
  },
  {
    nameEs: "Zancada búlgara con mancuernas",
    nameEn: "Dumbbell Bulgarian split squat",
    equipment: "mancuerna",
    pattern: "dominante_rodilla",
    muscleWeights: { gluteo: 0.4, cuadriceps: 0.45, isquiotibiales: 0.15 },
    registrationType: "peso_reps",
    unilateral: true,
    descriptionEs:
      "Pie trasero elevado sobre un banco, bajá flexionando la rodilla delantera hasta 90 grados y subí empujando el talón.",
    descriptionEn:
      "Rear foot elevated on a bench, lower by bending your front knee to about 90 degrees, then drive up through your front heel.",
  },
  {
    nameEs: "Patada de glúteo en máquina",
    nameEn: "Machine glute kickback",
    equipment: "maquina",
    pattern: "aislamiento",
    muscleWeights: { gluteo: 0.9, isquiotibiales: 0.1 },
    registrationType: "peso_reps",
    unilateral: true,
    descriptionEs:
      "Apoyado en la máquina, empujá una pierna hacia atrás y arriba apretando el glúteo, y volvé controlado.",
    descriptionEn:
      "Supported at the machine, push one leg back and up squeezing your glute, then return under control.",
  },
  {
    nameEs: "Puente de glúteo",
    nameEn: "Bodyweight glute bridge",
    equipment: "peso_corporal",
    pattern: "dominante_cadera",
    muscleWeights: { gluteo: 0.7, isquiotibiales: 0.3 },
    registrationType: "reps",
    unilateral: false,
    descriptionEs:
      "Acostado boca arriba con rodillas flexionadas, empujá la cadera hacia arriba apretando los glúteos y bajá controlado.",
    descriptionEn:
      "Lying on your back with knees bent, drive your hips up squeezing your glutes, then lower under control.",
  },

  // ---- ADUCTORES ----
  {
    nameEs: "Aductores en máquina",
    nameEn: "Machine hip adduction",
    equipment: "maquina",
    pattern: "aislamiento",
    muscleWeights: { aductores: 1.0 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "Sentado con las piernas abiertas contra las almohadillas, cerrá las piernas apretando la parte interna del muslo.",
    descriptionEn:
      "Seated with your legs open against the pads, squeeze your legs together working your inner thighs.",
  },
  {
    nameEs: "Aducción de cadera en polea",
    nameEn: "Cable hip adduction",
    equipment: "polea",
    pattern: "aislamiento",
    muscleWeights: { aductores: 1.0 },
    registrationType: "peso_reps",
    unilateral: true,
    descriptionEs:
      "Con el tobillo enganchado a la polea baja, cruzá la pierna hacia el centro del cuerpo y volvé controlado.",
    descriptionEn:
      "With the ankle strap on the low pulley, sweep your leg across your body's midline, then return under control.",
  },
  {
    nameEs: "Sentadilla sumo con mancuerna",
    nameEn: "Dumbbell sumo squat",
    equipment: "mancuerna",
    pattern: "dominante_rodilla",
    muscleWeights: { aductores: 0.4, cuadriceps: 0.35, gluteo: 0.25 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "Piernas bien abiertas y puntas hacia afuera, mancuerna colgando al centro. Bajá manteniendo el torso erguido y subí.",
    descriptionEn:
      "Feet wide with toes pointed out, dumbbell hanging in the center. Squat down keeping your torso upright, then stand back up.",
  },
  {
    nameEs: "Aducción de cadera tumbado",
    nameEn: "Side-lying hip adduction",
    equipment: "peso_corporal",
    pattern: "aislamiento",
    muscleWeights: { aductores: 1.0 },
    registrationType: "reps",
    unilateral: true,
    descriptionEs:
      "Acostado de costado con la pierna de abajo estirada, elevala hacia el techo y bajá controlado sin apoyar del todo.",
    descriptionEn:
      "Lying on your side with the bottom leg straight, lift it toward the ceiling, then lower under control without fully resting.",
  },

  // ---- GEMELO ----
  {
    nameEs: "Elevación de talones con barra",
    nameEn: "Barbell standing calf raise",
    equipment: "barra",
    pattern: "aislamiento",
    muscleWeights: { gemelo: 1.0 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "De pie con la barra en la espalda, elevá los talones lo más alto posible y bajá controlado hasta el estiramiento completo.",
    descriptionEn:
      "Standing with the bar on your back, raise your heels as high as possible, then lower under control to a full stretch.",
  },
  {
    nameEs: "Elevación de talones con mancuernas",
    nameEn: "Dumbbell standing calf raise",
    equipment: "mancuerna",
    pattern: "aislamiento",
    muscleWeights: { gemelo: 1.0 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "De pie con una mancuerna en cada mano, elevá los talones y bajá controlado.",
    descriptionEn:
      "Standing with a dumbbell in each hand, raise your heels, then lower under control.",
  },
  {
    nameEs: "Elevación de talones en máquina",
    nameEn: "Machine calf raise",
    equipment: "maquina",
    pattern: "aislamiento",
    muscleWeights: { gemelo: 1.0 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "Hombros bajo las almohadillas, elevá los talones lo más alto posible y bajá controlado.",
    descriptionEn:
      "Shoulders under the pads, raise your heels as high as possible, then lower under control.",
  },
  {
    nameEs: "Elevación de talones con peso corporal",
    nameEn: "Bodyweight calf raise",
    equipment: "peso_corporal",
    pattern: "aislamiento",
    muscleWeights: { gemelo: 1.0 },
    registrationType: "reps",
    unilateral: false,
    descriptionEs:
      "De pie, elevá los talones lo más alto posible apoyando en la punta de los pies y bajá controlado.",
    descriptionEn:
      "Standing, raise your heels as high as possible onto your toes, then lower under control.",
  },

  // ---- ABDOMEN ----
  {
    nameEs: "Crunch abdominal",
    nameEn: "Bodyweight crunch",
    equipment: "peso_corporal",
    pattern: "core",
    muscleWeights: { abdomen: 1.0 },
    registrationType: "reps",
    unilateral: false,
    descriptionEs:
      "Acostado con rodillas flexionadas, elevá los omóplatos del piso contrayendo el abdomen y bajá controlado.",
    descriptionEn:
      "Lying with knees bent, lift your shoulder blades off the floor by contracting your abs, then lower under control.",
  },
  {
    nameEs: "Plancha abdominal",
    nameEn: "Plank",
    equipment: "peso_corporal",
    pattern: "core",
    muscleWeights: { abdomen: 0.7, lumbar: 0.3 },
    registrationType: "tiempo",
    unilateral: false,
    descriptionEs:
      "Apoyado en antebrazos y puntas de pie, mantené el cuerpo en línea recta sin dejar caer la cadera.",
    descriptionEn:
      "Resting on forearms and toes, keep your body in a straight line without letting your hips sag.",
  },
  {
    nameEs: "Elevación de piernas colgado",
    nameEn: "Hanging leg raise",
    equipment: "peso_corporal",
    pattern: "core",
    muscleWeights: { abdomen: 0.85, antebrazo: 0.15 },
    registrationType: "reps",
    unilateral: false,
    descriptionEs:
      "Colgado de una barra fija, elevá las piernas hacia el pecho contrayendo el abdomen y bajá controlado.",
    descriptionEn:
      "Hanging from a fixed bar, raise your legs toward your chest by contracting your abs, then lower under control.",
  },
  {
    nameEs: "Crunch en polea",
    nameEn: "Cable crunch",
    equipment: "polea",
    pattern: "core",
    muscleWeights: { abdomen: 1.0 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "De rodillas frente a la polea alta, curvá el torso hacia abajo contrayendo el abdomen sin usar los brazos.",
    descriptionEn:
      "Kneeling in front of the high pulley, curl your torso down by contracting your abs, without pulling with your arms.",
  },
  {
    nameEs: "Crunch en máquina",
    nameEn: "Machine crunch",
    equipment: "maquina",
    pattern: "core",
    muscleWeights: { abdomen: 1.0 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "Sentado en la máquina, curvá el torso hacia adelante contrayendo el abdomen y volvé controlado.",
    descriptionEn:
      "Seated at the machine, curl your torso forward by contracting your abs, then return under control.",
  },
  {
    nameEs: "Giro ruso con mancuerna",
    nameEn: "Dumbbell Russian twist",
    equipment: "mancuerna",
    pattern: "core",
    muscleWeights: { abdomen: 0.85, lumbar: 0.15 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "Sentado con el torso inclinado atrás y pies elevados, girá la mancuerna de lado a lado sin perder la postura.",
    descriptionEn:
      "Seated with your torso leaned back and feet lifted, rotate the dumbbell from side to side while keeping your posture.",
  },

  // ---- LUMBAR ----
  {
    nameEs: "Peso muerto con barra",
    nameEn: "Barbell deadlift",
    equipment: "barra",
    pattern: "dominante_cadera",
    muscleWeights: { lumbar: 0.35, isquiotibiales: 0.3, gluteo: 0.25, dorsal: 0.1 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "Barra pegada a las piernas, espalda neutra. Levantá extendiendo cadera y rodillas al mismo tiempo, sin redondear la espalda baja.",
    descriptionEn:
      "Bar close to your legs, neutral spine. Stand up by extending your hips and knees together, without rounding your lower back.",
  },
  {
    nameEs: "Buenos días con barra",
    nameEn: "Barbell good morning",
    equipment: "barra",
    pattern: "dominante_cadera",
    muscleWeights: { lumbar: 0.5, isquiotibiales: 0.35, gluteo: 0.15 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "Barra apoyada en la espalda alta, empujá la cadera hacia atrás inclinando el torso hasta casi paralelo al piso y volvé.",
    descriptionEn:
      "Bar resting on your upper back, push your hips back leaning your torso to near-parallel with the floor, then return to standing.",
  },
  {
    nameEs: "Buenos días con mancuerna",
    nameEn: "Dumbbell good morning",
    equipment: "mancuerna",
    pattern: "dominante_cadera",
    muscleWeights: { lumbar: 0.5, isquiotibiales: 0.35, gluteo: 0.15 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "Mancuerna sostenida contra el pecho, empujá la cadera hacia atrás inclinando el torso hasta casi paralelo al piso y volvé.",
    descriptionEn:
      "Dumbbell held against your chest, push your hips back leaning your torso to near-parallel with the floor, then return to standing.",
  },
  {
    nameEs: "Extensión lumbar en máquina",
    nameEn: "Machine back extension",
    equipment: "maquina",
    pattern: "aislamiento",
    muscleWeights: { lumbar: 0.85, gluteo: 0.15 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "Cadera apoyada en el banco, bajá el torso controlado y extendé hasta que el cuerpo quede recto, sin hiperextender.",
    descriptionEn:
      "Hips supported on the pad, lower your torso under control and extend until your body is straight, without hyperextending.",
  },
  {
    nameEs: "Hiperextensión con peso corporal",
    nameEn: "Bodyweight superman",
    equipment: "peso_corporal",
    pattern: "aislamiento",
    muscleWeights: { lumbar: 0.85, gluteo: 0.15 },
    registrationType: "reps",
    unilateral: false,
    descriptionEs:
      "Acostado boca abajo, elevá brazos y piernas al mismo tiempo apretando la zona lumbar y bajá controlado.",
    descriptionEn:
      "Lying face down, lift your arms and legs at the same time squeezing your lower back, then lower under control.",
  },
  {
    nameEs: "Swing con kettlebell",
    nameEn: "Kettlebell swing",
    equipment: "kettlebell",
    pattern: "dominante_cadera",
    muscleWeights: { gluteo: 0.35, isquiotibiales: 0.3, lumbar: 0.2, abdomen: 0.15 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "Pie separados al ancho de hombros, impulsá la kettlebell con la cadera hasta la altura del pecho, sin usar los brazos para levantarla.",
    descriptionEn:
      "Feet shoulder-width apart, drive the kettlebell up to chest height using your hips, without lifting with your arms.",
  },

  // ---- EQUIPOS ADICIONALES (kettlebell / banda) ----
  {
    nameEs: "Sentadilla goblet con kettlebell",
    nameEn: "Kettlebell goblet squat",
    equipment: "kettlebell",
    pattern: "dominante_rodilla",
    muscleWeights: { cuadriceps: 0.55, gluteo: 0.3, isquiotibiales: 0.15 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "Kettlebell sostenida contra el pecho, bajá en sentadilla manteniendo el torso erguido y los codos entre las rodillas.",
    descriptionEn:
      "Hold a kettlebell against your chest, squat down keeping your torso upright and elbows between your knees.",
  },
  {
    nameEs: "Peso muerto rumano con kettlebell",
    nameEn: "Kettlebell Romanian deadlift",
    equipment: "kettlebell",
    pattern: "dominante_cadera",
    muscleWeights: { isquiotibiales: 0.55, gluteo: 0.35, lumbar: 0.1 },
    registrationType: "peso_reps",
    unilateral: false,
    descriptionEs:
      "Piernas casi extendidas, empujá la cadera hacia atrás bajando la kettlebell pegada a las piernas y volvé extendiendo la cadera.",
    descriptionEn:
      "Legs nearly straight, push your hips back lowering the kettlebell close to your legs, then return by extending your hips.",
  },
  {
    nameEs: "Apertura con banda",
    nameEn: "Band pull-apart",
    equipment: "banda",
    pattern: "traccion_horizontal",
    muscleWeights: { deltoidePosterior: 0.5, espaldaAltaTrapecio: 0.4, dorsal: 0.1 },
    registrationType: "reps",
    unilateral: false,
    descriptionEs:
      "Banda estirada al frente con los brazos extendidos, abrí los brazos hacia los costados apretando entre los omóplatos.",
    descriptionEn:
      "Band stretched in front of you with arms extended, pull it apart to the sides squeezing your shoulder blades together.",
  },
  {
    nameEs: "Elevación lateral con banda",
    nameEn: "Band lateral raise",
    equipment: "banda",
    pattern: "aislamiento",
    muscleWeights: { deltoideLateral: 0.85, espaldaAltaTrapecio: 0.15 },
    registrationType: "reps",
    unilateral: false,
    descriptionEs:
      "Parado sobre la banda, elevá el brazo hacia el costado hasta la altura del hombro y bajá controlado.",
    descriptionEn:
      "Standing on the band, raise your arm out to the side to shoulder height, then lower under control.",
  },
  {
    nameEs: "Curl con banda",
    nameEn: "Band bicep curl",
    equipment: "banda",
    pattern: "aislamiento",
    muscleWeights: { biceps: 0.9, antebrazo: 0.1 },
    registrationType: "reps",
    unilateral: false,
    descriptionEs:
      "Parado sobre la banda con los codos pegados al torso, flexioná los brazos llevando las manos hacia los hombros.",
    descriptionEn:
      "Standing on the band with elbows close to your torso, curl your hands up toward your shoulders.",
  },
  {
    nameEs: "Extensión de tríceps con banda",
    nameEn: "Band triceps pushdown",
    equipment: "banda",
    pattern: "aislamiento",
    muscleWeights: { triceps: 0.95, antebrazo: 0.05 },
    registrationType: "reps",
    unilateral: false,
    descriptionEs:
      "Banda anclada arriba, codos pegados al torso, empujá hacia abajo hasta extender los brazos y volvé controlado.",
    descriptionEn:
      "Band anchored overhead, elbows close to your torso, push down to full extension, then return under control.",
  },
];
