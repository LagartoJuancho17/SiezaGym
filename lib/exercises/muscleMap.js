// Traduce nuestros 16 grupos musculares a los slugs de body parts de
// react-muscle-highlighter (MIT, ver package.json). El deltoide se declara en
// 3 sub-grupos (anterior/lateral/posterior) para el peso muscular, pero la
// libreria solo tiene un slug "deltoids" -- se suman los 3 al agregar.
export const MUSCLE_GROUP_TO_SLUG = {
  pecho: "chest",
  dorsal: "upper-back",
  espaldaAltaTrapecio: "trapezius",
  deltoideAnterior: "deltoids",
  deltoideLateral: "deltoids",
  deltoidePosterior: "deltoids",
  biceps: "biceps",
  triceps: "triceps",
  antebrazo: "forearm",
  cuadriceps: "quadriceps",
  isquiotibiales: "hamstring",
  gluteo: "gluteal",
  aductores: "adductors",
  gemelo: "calves",
  abdomen: "abs",
  lumbar: "lower-back",
};

const TEAL2_RGB = "103, 210, 222";

function colorForWeight(weight) {
  const opacity = Math.min(1, 0.32 + weight * 0.68);
  return `rgba(${TEAL2_RGB}, ${opacity.toFixed(2)})`;
}

// Agrupa por slug (suma pesos que colapsan al mismo slug, ej. los 3 deltoides)
// y devuelve el array `data` que espera <Body />, coloreado en escala de
// nuestro teal segun el peso -- mas peso, mas opaco.
export function muscleWeightsToBodyParts(muscleWeights) {
  const bySlug = {};
  for (const [muscle, weight] of Object.entries(muscleWeights || {})) {
    const slug = MUSCLE_GROUP_TO_SLUG[muscle];
    if (!slug) continue;
    bySlug[slug] = (bySlug[slug] || 0) + (Number(weight) || 0);
  }
  return Object.entries(bySlug).map(([slug, weight]) => ({
    slug,
    color: colorForWeight(weight),
  }));
}
