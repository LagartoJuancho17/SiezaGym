export const MUSCLE_GROUPS = [
  "pecho",
  "dorsal",
  "espaldaAltaTrapecio",
  "deltoideAnterior",
  "deltoideLateral",
  "deltoidePosterior",
  "biceps",
  "triceps",
  "antebrazo",
  "cuadriceps",
  "isquiotibiales",
  "gluteo",
  "aductores",
  "gemelo",
  "abdomen",
  "lumbar",
];

export const MUSCLE_GROUP_LABELS = {
  pecho: "Pecho",
  dorsal: "Dorsal",
  espaldaAltaTrapecio: "Espalda alta y trapecio",
  deltoideAnterior: "Deltoide anterior",
  deltoideLateral: "Deltoide lateral",
  deltoidePosterior: "Deltoide posterior",
  biceps: "Bíceps",
  triceps: "Tríceps",
  antebrazo: "Antebrazo",
  cuadriceps: "Cuádriceps",
  isquiotibiales: "Isquiotibiales",
  gluteo: "Glúteo",
  aductores: "Aductores",
  gemelo: "Gemelo",
  abdomen: "Abdomen",
  lumbar: "Lumbar",
};

export const EQUIPMENT = [
  "barra",
  "mancuerna",
  "maquina",
  "polea",
  "peso_corporal",
  "banda",
  "kettlebell",
];

export const EQUIPMENT_LABELS = {
  barra: "Barra",
  mancuerna: "Mancuerna",
  maquina: "Máquina",
  polea: "Polea",
  peso_corporal: "Peso corporal",
  banda: "Banda",
  kettlebell: "Kettlebell",
};

export const PATTERNS = [
  "empuje_horizontal",
  "empuje_vertical",
  "traccion_horizontal",
  "traccion_vertical",
  "dominante_rodilla",
  "dominante_cadera",
  "aislamiento",
  "core",
];

export const PATTERN_LABELS = {
  empuje_horizontal: "Empuje horizontal",
  empuje_vertical: "Empuje vertical",
  traccion_horizontal: "Tracción horizontal",
  traccion_vertical: "Tracción vertical",
  dominante_rodilla: "Dominante de rodilla",
  dominante_cadera: "Dominante de cadera",
  aislamiento: "Aislamiento",
  core: "Core",
};

export const REGISTRATION_TYPES = ["peso_reps", "reps", "tiempo", "distancia_tiempo"];

export const REGISTRATION_TYPE_LABELS = {
  peso_reps: "Peso × reps",
  reps: "Solo reps",
  tiempo: "Tiempo",
  distancia_tiempo: "Distancia + tiempo",
};

export function isTimeBasedRegistration(registrationType) {
  return registrationType === "tiempo" || registrationType === "distancia_tiempo";
}

const WEIGHT_SUM_EPSILON = 0.01;

export function muscleWeightsSum(muscleWeights) {
  return Object.values(muscleWeights || {}).reduce((total, value) => total + (Number(value) || 0), 0);
}

export function isValidMuscleWeights(muscleWeights) {
  if (!muscleWeights || typeof muscleWeights !== "object") return false;
  const entries = Object.entries(muscleWeights);
  if (!entries.length) return false;
  if (!entries.every(([key, value]) => MUSCLE_GROUPS.includes(key) && Number(value) > 0)) return false;
  return Math.abs(muscleWeightsSum(muscleWeights) - 1) <= WEIGHT_SUM_EPSILON;
}
